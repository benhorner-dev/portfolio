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
        print_error "OPENAI_API_KEY environment variable is not set"
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
            max_tokens: 16384
        }' 2>/dev/null); then
        print_error "Failed to build JSON payload for $file_path"
        echo "$file_content"
        return 1
    fi

    # Make the API call
    if ! curl_response=$(curl -s --max-time 30 https://api.openai.com/v1/chat/completions \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $OPENAI_API_KEY" \
        -d "$api_payload" 2>/dev/null); then
        print_error "Failed to make API call to OpenAI for $file_path"
        echo "$file_content"
        return 1
    fi

    # Parse the response
    if ! response=$(echo "$curl_response" | jq -r '.choices[0].message.content' 2>/dev/null); then
        print_error "Failed to parse OpenAI API response for $file_path"
        print_debug "Raw response: $curl_response"
        echo "$file_content"
        return 1
    fi

    if [ -z "$response" ] || [ "$response" = "null" ]; then
        print_error "Empty or null response from OpenAI API for $file_path"
        print_debug "Raw response: $curl_response"
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

    # Read original content
    local original_content
    original_content=$(cat "$file_path")

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
        if doc_content=$(generate_docstrings "$original_content" "$error_message" "$file_path"); then
            # Write the documented content
            echo "$doc_content" > "$file_path"

            # Try to validate the syntax
            if bunx tsc --noEmit --skipLibCheck --allowJs "$file_path" 2>/dev/null || \
               node --check "$file_path" 2>/dev/null; then
                print_info "✅ Successfully added TSDoc to: $file_path"
                return 0
            fi
        fi

        error_message="Syntax validation failed"
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
