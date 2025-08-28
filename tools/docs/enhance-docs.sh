#!/bin/bash
# enhance-docs.sh - Adds TSDoc comments to changed files before TypeDoc generation
# This script runs BEFORE sync-wiki.sh

set -e

# Configuration
OPENAI_API_KEY="${OPENAI_API_KEY}"
TEMP_BACKUP_DIR="./.temp-backup"
MAX_RETRY_COUNT=3
TYPEDOC_CONFIG="${TYPEDOC_CONFIG:-./.config/typedoc.json}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# Function to check if file exists
file_exists() {
    [ -f "$1" ]
}

# Function to check if directory exists
dir_exists() {
    [ -d "$1" ]
}

# Function to ensure directory exists
ensure_directory_exists() {
    local dir="$1"
    if ! dir_exists "$dir"; then
        mkdir -p "$dir"
    fi
}

# Function to generate docstrings using OpenAI API
generate_docstrings() {
    local file_content="$1"
    local error_message="$2"
    local file_path="$3"

    print_info "🤖 Generating TSDoc for: $file_path"

    local prompt="You are a TypeScript documentation expert. Add comprehensive TypeDoc documentation to this code.

Requirements:
- Add JSDoc/TSDoc comments with @module, @remarks, @param, @returns, @throws, @example tags
- Make documentation rich, detailed, and helpful
- Explain what the code does, why it exists, and how to use it
- Include usage examples where appropriate
- Document edge cases and important considerations

CRITICAL RULES:
- Return ONLY the complete TypeScript/JavaScript code with added documentation
- Do NOT include any explanatory text, introductions, or conclusions
- Do NOT wrap in markdown code blocks (```)
- Do NOT add triple-slash directives (/// <reference ...>)
- Start your response immediately with the first import/code line
- End your response with the last line of code
- Preserve all functionality exactly as is
- Ensure syntactically valid TypeScript/JavaScript

Your response must be valid code that can be directly saved to a .ts file."

    if [ -n "$error_message" ]; then
        prompt="$prompt

Previous attempt had an error: $error_message
Please fix and retry."
    fi

    prompt="$prompt

File: $file_path

Code:
$file_content"

    # Make API call to OpenAI
    local response
    local curl_response
    local api_payload

    # Check if OPENAI_API_KEY is set
    if [ -z "$OPENAI_API_KEY" ]; then
        print_error "OPENAI_API_KEY environment variable is not set" >&2
        echo "$file_content"
        return 1
    fi

    # Check if API key looks valid (should start with sk-)
    if ! echo "$OPENAI_API_KEY" | grep -q "^sk-"; then
        print_error "OPENAI_API_KEY does not appear to be valid (should start with 'sk-')" >&2
        echo "$file_content"
        return 1
    fi

    # Build JSON payload
    if ! api_payload=$(jq -n \
        --arg model "gpt-4o-mini" \
        --arg content "$prompt" \
        '{
            model: $model,
            messages: [{role: "user", content: $content}],
            temperature: 0.3,
            max_tokens: 4096
        }' 2>/dev/null); then
        print_error "Failed to build JSON payload for $file_path" >&2
        echo "$file_content"
        return 1
    fi

    # Calculate timeout based on file size (minimum 30s, +1s per 10 lines)
    local file_lines
    file_lines=$(echo "$file_content" | wc -l)
    local timeout=$((30 + file_lines / 10))
    [ "$timeout" -gt 120 ] && timeout=120  # Cap at 2 minutes

    print_debug "Using timeout of ${timeout}s for file with $file_lines lines"

    # Make the API call
    local curl_exit_code
    curl_response=$(curl -s --max-time "$timeout" -w "HTTP_CODE:%{http_code}" https://api.openai.com/v1/chat/completions \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $OPENAI_API_KEY" \
        -d "$api_payload" 2>/dev/null)
    curl_exit_code=$?

    if [ $curl_exit_code -ne 0 ]; then
        local curl_error_msg
        case $curl_exit_code in
            6) curl_error_msg="Couldn't resolve host" ;;
            7) curl_error_msg="Failed to connect to host" ;;
            28) curl_error_msg="Operation timeout" ;;
            35) curl_error_msg="SSL connect error" ;;
            52) curl_error_msg="Empty reply from server" ;;
            56) curl_error_msg="Failure receiving network data" ;;
            *) curl_error_msg="Unknown curl error" ;;
        esac

        print_error "Failed to make API call to OpenAI for $file_path" >&2
        print_error "  Curl exit code: $curl_exit_code ($curl_error_msg)" >&2
        print_error "  Timeout used: ${timeout}s" >&2
        echo "$file_content"
        return 1
    fi

    # Extract HTTP status code and response body
    local http_code=$(echo "$curl_response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
    curl_response=$(echo "$curl_response" | sed 's/HTTP_CODE:[0-9]*$//')

    if [ -n "$http_code" ] && [ "$http_code" -ne 200 ]; then
        print_error "OpenAI API returned HTTP $http_code for $file_path" >&2

        # Try to parse the error details from the API response
        local error_code error_message error_type
        if command -v jq >/dev/null 2>&1; then
            error_code=$(echo "$curl_response" | jq -r '.error.code // "unknown"' 2>/dev/null)
            error_message=$(echo "$curl_response" | jq -r '.error.message // "No message"' 2>/dev/null)
            error_type=$(echo "$curl_response" | jq -r '.error.type // "unknown"' 2>/dev/null)

            print_error "  Error Code: $error_code" >&2
            print_error "  Error Type: $error_type" >&2
            print_error "  Error Message: $error_message" >&2
        fi

        print_debug "Full response body: $curl_response" >&2
        echo "$file_content"
        return 1
    fi

    # Parse the response
    if ! response=$(echo "$curl_response" | jq -r '.choices[0].message.content' 2>/dev/null); then
        print_error "Failed to parse OpenAI API response for $file_path" >&2
        print_debug "Raw response: $curl_response" >&2
        echo "$file_content"
        return 1
    fi

    if [ -z "$response" ] || [ "$response" = "null" ]; then
        print_error "Empty or null response from OpenAI API for $file_path" >&2
        print_debug "Raw response: $curl_response" >&2
        echo "$file_content"
        return 1
    fi

    # Basic validation: check if response looks like code
    if ! echo "$response" | grep -q -E "(import|export|function|class|interface|const|let|var)"; then
        print_error "API response doesn't appear to contain valid TypeScript code for $file_path" >&2
        print_debug "Response preview (first 200 chars): $(echo "$response" | head -c 200)..." >&2
        echo "$file_content"
        return 1
    fi

    # Check for common API response artifacts that shouldn't be in code
    if echo "$response" | grep -q -E "(```|Here's|I'll help|Let me|The code)"; then
        print_error "API response contains explanation text instead of pure code for $file_path" >&2
        print_debug "Response preview (first 200 chars): $(echo "$response" | head -c 200)..." >&2
        echo "$file_content"
        return 1
    fi

    echo "$response"
    return 0
}

# Function to backup original files
backup_file() {
    local file="$1"
    local backup_dir="${TEMP_BACKUP_DIR}/$(dirname "$file")"

    ensure_directory_exists "$backup_dir"
    cp "$file" "${TEMP_BACKUP_DIR}/$file"
    print_debug "💾 Backed up: $file"
}

# Function to restore original files
restore_file() {
    local file="$1"

    if file_exists "${TEMP_BACKUP_DIR}/$file"; then
        cp "${TEMP_BACKUP_DIR}/$file" "$file"
        print_debug "♻️ Restored: $file"
    else
        print_warning "No backup found for: $file"
    fi
}

# Function to process a single file with TSDoc injection
process_file_with_tsdoc() {
    local file_path="$1"
    local retry_count=0
    local error_message=""

    # Skip if file doesn't exist
    if ! file_exists "$file_path"; then
        print_warning "File not found: $file_path"
        return 1
    fi

    # Skip test files (they typically don't need TSDoc)
    if echo "$file_path" | grep -q -E '\.(test|spec)\.(ts|tsx|js|jsx)$'; then
        print_info "📝 Skipping test file: $file_path"
        return 0
    fi

    # Read original content
    local original_content
    original_content=$(cat "$file_path")

    # Check file size (line count)
    local line_count
    line_count=$(echo "$original_content" | wc -l)

    # Skip very large files (over 500 lines)
    if [ "$line_count" -gt 500 ]; then
        print_info "📝 Skipping large file ($line_count lines): $file_path"
        return 0
    fi

    # Skip if file already has substantial documentation
    local doc_lines
    doc_lines=$(echo "$original_content" | grep -c "^\s*\*" || true)
    doc_lines=${doc_lines:-0}
    if [ "$doc_lines" -gt 20 ]; then
        print_info "📝 File already well documented: $file_path"
        return 0
    fi

    # Backup the original file
    backup_file "$file_path"

    while [ $retry_count -lt $MAX_RETRY_COUNT ]; do
        local doc_content
        local temp_error_file="/tmp/generate_docstrings_error_$$"

        # Call generate_docstrings and capture both stdout and stderr
        if doc_content=$(generate_docstrings "$original_content" "$error_message" "$file_path" 2>"$temp_error_file"); then
            # Write the documented content
            echo "$doc_content" > "$file_path"

            # Try to validate the syntax
            local tsc_errors
            if tsc_errors=$(bunx tsc --noEmit --skipLibCheck --allowJs "$file_path" 2>&1) || \
               node --check "$file_path" 2>/dev/null; then
                print_info "✅ Successfully added TSDoc to: $file_path"
                rm -f "$temp_error_file"
                return 0
            else
                print_error "TypeScript validation failed for $file_path" >&2
                print_debug "TypeScript errors: $tsc_errors" >&2
                print_debug "Generated content preview (first 300 chars):" >&2
                print_debug "$(head -c 300 "$file_path")" >&2
                error_message="Syntax validation failed: $(echo "$tsc_errors" | head -n 3 | tr '\n' '; ')"
            fi
        else
            # Function failed, show the error output
            if [ -s "$temp_error_file" ]; then
                print_error "generate_docstrings failed with error:"
                cat "$temp_error_file" >&2
            else
                print_error "generate_docstrings failed with no error output"
            fi
            error_message="API call failed"
        fi

        rm -f "$temp_error_file"
        retry_count=$((retry_count + 1))
        print_warning "⚠️ Retry $retry_count of $MAX_RETRY_COUNT for $file_path"
    done

    # If all retries failed, restore original
    restore_file "$file_path"
    print_error "❌ Failed to add TSDoc to $file_path after $MAX_RETRY_COUNT attempts"
    return 1
}

# Function to cleanup temporary files
cleanup() {
    # Restore all backed up files
    if dir_exists "$TEMP_BACKUP_DIR"; then
        print_info "🧹 Restoring original files (removing TSDoc from codebase)..."

        find "$TEMP_BACKUP_DIR" -type f | while read -r backup_file; do
            # Remove the backup dir prefix to get original path
            local original_file="${backup_file#$TEMP_BACKUP_DIR/}"
            if [ -f "$backup_file" ]; then
                cp "$backup_file" "$original_file"
                print_debug "Restored: $original_file"
            fi
        done

        rm -rf "$TEMP_BACKUP_DIR"
        print_info "✨ Cleaned up temporary files"
    fi
}

# Main function
main() {
    print_info "🚀 Starting TSDoc enhancement for changed files..."

    # Check for required dependencies
    command -v jq >/dev/null 2>&1 || { print_error "jq is required but not installed."; exit 1; }
    command -v curl >/dev/null 2>&1 || { print_error "curl is required but not installed."; exit 1; }
    command -v bunx >/dev/null 2>&1 || command -v bun >/dev/null 2>&1 || { print_error "bun is required but not installed."; exit 1; }

    # Check for OpenAI API key
    if [ -z "$OPENAI_API_KEY" ]; then
        print_error "OPENAI_API_KEY environment variable is not set"
        exit 1
    fi

    # Create temp backup directory
    ensure_directory_exists "$TEMP_BACKUP_DIR"

    # Get changed files from git
    local changed_files=""

    if [ -n "${GITHUB_SHA:-}" ]; then
        # In GitHub Actions - get files changed in this push
        print_info "📊 Running in GitHub Actions environment"

        # Try to get the diff from the push
        if [ -n "${GITHUB_EVENT_BEFORE:-}" ] && [ "${GITHUB_EVENT_BEFORE}" != "0000000000000000000000000000000000000000" ]; then
            changed_files=$(git diff --name-only "${GITHUB_EVENT_BEFORE}..${GITHUB_SHA}" 2>/dev/null || echo "")
        else
            # Fallback to comparing with previous commit
            changed_files=$(git diff --name-only HEAD^ HEAD 2>/dev/null || echo "")
        fi
    else
        # Local development - compare with main/master
        print_info "💻 Running in local environment"
        changed_files=$(git diff --name-only origin/main...HEAD 2>/dev/null || \
                        git diff --name-only origin/master...HEAD 2>/dev/null || \
                        git diff --name-only main...HEAD 2>/dev/null || \
                        echo "")
    fi

    # Filter for TypeScript/JavaScript files
    local ts_files=""
    if [ -n "$changed_files" ]; then
        ts_files=$(echo "$changed_files" | grep -E '\.(ts|tsx|js|jsx)$' | grep -v node_modules | grep -v dist | grep -v build | grep -v coverage || true)
    fi

    local enhanced_count=0
    local failed_count=0

    if [ -z "$ts_files" ]; then
        print_warning "📭 No TypeScript/JavaScript files changed in this commit"
        print_info "Skipping TSDoc enhancement..."
    else
        print_info "📝 Found changed TypeScript/JavaScript files:"
        echo "$ts_files" | while IFS= read -r file; do
            [ -n "$file" ] && echo "  - $file"
        done

        # Process each changed file
        echo "$ts_files" | while IFS= read -r file; do
            if [ -n "$file" ] && file_exists "$file"; then
                if process_file_with_tsdoc "$file"; then
                    enhanced_count=$((enhanced_count + 1))
                else
                    failed_count=$((failed_count + 1))
                fi
            fi
        done

        print_info "📈 Enhancement complete: $enhanced_count succeeded, $failed_count failed"
    fi

    # Generate TypeDoc documentation
    print_info "📚 Generating TypeDoc documentation..."

    if [ -f "$TYPEDOC_CONFIG" ]; then
        bunx typedoc --options "$TYPEDOC_CONFIG" || {
            print_warning "TypeDoc generation had issues, but continuing..."
        }
    else
        print_warning "TypeDoc config not found at $TYPEDOC_CONFIG, using defaults..."
        bunx typedoc || {
            print_warning "TypeDoc generation had issues, but continuing..."
        }
    fi

    # The cleanup function will restore all original files
    cleanup

    print_info "✅ TSDoc enhancement completed successfully!"
    print_info "   Original files have been restored (TSDoc removed from codebase)"
    print_info "   Generated documentation is ready in the output directory"
}

# Set up trap for cleanup on exit
trap cleanup EXIT INT TERM

# Run main function
main "$@"
