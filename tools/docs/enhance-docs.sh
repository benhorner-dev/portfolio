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

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -d, --directory DIR    Test all TypeScript/JavaScript files in the specified directory"
    echo "  -f, --files FILE...    Test specific files (space-separated)"
    echo "  -h, --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                           # Use git diff (original behavior)"
    echo "  $0 -d src/components         # Test all files in src/components"
    echo "  $0 -d .                      # Test all files in current directory"
    echo "  $0 -f file1.ts file2.js      # Test specific files"
    echo ""
    echo "Environment Variables:"
    echo "  OPENAI_API_KEY               Required for TSDoc generation"
    echo "  TYPEDOC_CONFIG               Path to TypeDoc config (default: ./.config/typedoc.json)"
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

# Function to get files from directory
get_files_from_directory() {
    local target_dir="$1"

    if ! dir_exists "$target_dir"; then
        print_error "Directory not found: $target_dir"
        return 1
    fi

    find "$target_dir" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
        ! -path "*/node_modules/*" \
        ! -path "*/dist/*" \
        ! -path "*/build/*" \
        ! -path "*/coverage/*" \
        ! -path "*/.next/*" \
        ! -path "*/out/*"
}

# Function to get changed files from git
get_changed_files_from_git() {
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
    if [ -n "$changed_files" ]; then
        echo "$changed_files" | grep -E '\.(ts|tsx|js|jsx)$' | grep -v node_modules | grep -v dist | grep -v build | grep -v coverage || true
    fi
}

# Function to generate docstrings using OpenAI API
generate_docstrings() {
    local file_content="$1"
    local error_message="$2"
    local file_path="$3"

    print_info "🤖 Generating TSDoc for: $file_path" >&2

    local prompt="You are a TypeScript documentation expert. Add comprehensive TypeDoc documentation to this code.

Requirements:
- Add JSDoc/TSDoc comments with @module, @remarks, @param, @returns, @throws, @example tags
- Make documentation rich, detailed, and helpful
- Explain what the code does, why it exists, and how to use it
- Include usage examples where appropriate
- Document edge cases and important considerations

Rules:
- Do NOT add triple-slash directives (/// <reference ...>)
- Return ONLY the code with documentation, no explanations
- Do NOT wrap in markdown code blocks
- Preserve all functionality exactly as is
- Ensure syntactically valid TypeScript/JavaScript"

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

    print_debug "Using timeout of ${timeout}s for file with $file_lines lines" >&2

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
    else
        echo "$response"
        return 0
    fi
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
            echo "$doc_content" > "$file_path"

            # Format the file
            print_debug "Formatting file: $file_path"
            if ! bunx turbo format 2>/dev/null; then
                print_warning "Failed to format files, continuing..."
            fi

            # Generate TypeDoc documentation
            print_debug "Generating TypeDoc documentation..."
            if [ -f "$TYPEDOC_CONFIG" ]; then
                if ! bunx typedoc --options "$TYPEDOC_CONFIG" 2>/dev/null; then
                    print_warning "TypeDoc generation had issues, continuing..."
                fi
            else
                if ! bunx typedoc 2>/dev/null; then
                    print_warning "TypeDoc generation had issues, continuing..."
                fi
            fi

            # Successfully generated documentation
            print_info "✅ Successfully added TSDoc to: $file_path"
            rm -f "$temp_error_file"
            return 0
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
    local mode="git"  # Default mode
    local target_directory=""
    local specific_files=()

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -d|--directory)
                mode="directory"
                target_directory="$2"
                shift 2
                ;;
            -f|--files)
                mode="files"
                shift
                # Collect all remaining arguments as files
                while [[ $# -gt 0 ]] && [[ $1 != -* ]]; do
                    specific_files+=("$1")
                    shift
                done
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done

    print_info "🚀 Starting TSDoc enhancement..."
    print_info "   Mode: $mode"

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

    # Get list of files to process based on mode
    local ts_files=""

    case $mode in
        "directory")
            print_info "📁 Processing directory: $target_directory"
            ts_files=$(get_files_from_directory "$target_directory")
            ;;
        "files")
            print_info "📋 Processing specific files"
            # Validate that all specified files exist and are TS/JS files
            for file in "${specific_files[@]}"; do
                if ! file_exists "$file"; then
                    print_error "File not found: $file"
                    exit 1
                fi
                if ! echo "$file" | grep -q -E '\.(ts|tsx|js|jsx)$'; then
                    print_warning "Not a TypeScript/JavaScript file: $file"
                fi
            done
            # Convert array to newline-separated string
            printf '%s\n' "${specific_files[@]}" | grep -E '\.(ts|tsx|js|jsx)$' || true
            ts_files=$(printf '%s\n' "${specific_files[@]}" | grep -E '\.(ts|tsx|js|jsx)$' || true)
            ;;
        "git")
            print_info "🔍 Using git diff to find changed files"
            ts_files=$(get_changed_files_from_git)
            ;;
    esac

    local enhanced_count=0
    local failed_count=0

    if [ -z "$ts_files" ]; then
        print_warning "📭 No TypeScript/JavaScript files to process"
        print_info "Skipping TSDoc enhancement..."
    else
        print_info "📝 Found TypeScript/JavaScript files to process:"
        echo "$ts_files" | while IFS= read -r file; do
            [ -n "$file" ] && echo "  - $file"
        done

        # Process each file
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
