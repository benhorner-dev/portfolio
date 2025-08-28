#!/bin/bash
set -e

# Default values
REPO_DIR="."
ENRICHED_FILES_LIST="/tmp/enriched_files.txt"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--directory)
            REPO_DIR="$2"
            shift 2
            ;;
        --enriched-list)
            ENRICHED_FILES_LIST="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "🎯 Enhancing documentation for changed files..."
echo "Repository directory: $REPO_DIR"
echo "Enriched files list: $ENRICHED_FILES_LIST"

# Initialize the enriched files list
echo "" > "$ENRICHED_FILES_LIST"

# Get the list of changed files
if [ -n "$GITHUB_SHA" ] && [ -n "$GITHUB_EVENT_BEFORE" ]; then
    echo "📋 Getting changed files from git diff..."
    CHANGED_FILES=$(git diff --name-only "$GITHUB_EVENT_BEFORE" "$GITHUB_SHA" | grep -E '\.(ts|tsx|js|jsx)$' || true)
else
    echo "⚠️  No git SHA information available, processing all TypeScript/JavaScript files"
    CHANGED_FILES=$(find "$REPO_DIR" -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules | grep -v .next | grep -v dist)
fi

if [ -z "$CHANGED_FILES" ]; then
    echo "📭 No TypeScript/JavaScript files changed"
    exit 0
fi

echo "📝 Found $(echo "$CHANGED_FILES" | wc -l) changed files to process:"
echo "$CHANGED_FILES" | sed 's/^/  - /'

# Process each changed file
ENRICHED_COUNT=0
FAILED_COUNT=0

for file in $CHANGED_FILES; do
    if [ ! -f "$file" ]; then
        echo "⚠️  File not found: $file (may have been deleted)"
        continue
    fi

    echo "🔍 Processing: $file"

    # Here you would call your TSDoc enhancement logic
    # This is a placeholder - replace with your actual enhancement script/tool
    if enhance_file_with_tsdoc "$file"; then
        echo "✅ Enhanced: $file"
        echo "$file" >> "$ENRICHED_FILES_LIST"
        ((ENRICHED_COUNT++))
    else
        echo "❌ Failed to enhance: $file"
        ((FAILED_COUNT++))
    fi
done

# Function to enhance a single file with TSDoc (placeholder)
enhance_file_with_tsdoc() {
    local file_path="$1"

    # Placeholder for your actual TSDoc enhancement logic
    # This might involve:
    # 1. Analyzing the file with AST parsing
    # 2. Calling an LLM API to generate TSDoc comments
    # 3. Injecting the comments back into the file

    echo "🤖 Calling LLM to enhance $file_path with TSDoc..."

    # Example implementation (replace with your actual logic):
    # if call_llm_to_enhance_tsdoc "$file_path"; then
    #     return 0
    # else
    #     return 1
    # fi

    # For now, just return success as placeholder
    return 0
}

# Clean up empty lines from the enriched files list
sed -i '/^$/d' "$ENRICHED_FILES_LIST"

echo ""
echo "📊 Enhancement Summary:"
echo "- Files processed: $(echo "$CHANGED_FILES" | wc -l)"
echo "- Successfully enhanced: $ENRICHED_COUNT"
echo "- Failed to enhance: $FAILED_COUNT"
echo "- Enriched files list saved to: $ENRICHED_FILES_LIST"

if [ $ENRICHED_COUNT -gt 0 ]; then
    echo ""
    echo "📝 Enhanced files:"
    cat "$ENRICHED_FILES_LIST" | sed 's/^/  - /'
fi

echo "✅ Enhancement process completed!"
