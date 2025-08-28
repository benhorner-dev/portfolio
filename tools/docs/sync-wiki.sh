#!/bin/bash
set -e

WIKI_DIR="wiki"
REPO_ROOT="."
ENHANCED_FILES_LIST="${1:-}"  # Pass enhanced files list as first argument

echo "🧹 Cleaning wiki directory..."
# Clean wiki but keep .git and preserve existing code-docs
find "$WIKI_DIR" -mindepth 1 -not -path "$WIKI_DIR/.git*" -not -path "$WIKI_DIR/docs/code-docs*" -delete

# If code-docs exists, we'll do selective sync later
CODE_DOCS_EXISTS=false
if [ -d "$WIKI_DIR/docs/code-docs" ]; then
    CODE_DOCS_EXISTS=true
    echo "📋 Existing code-docs found, will do selective sync"
fi

echo "📄 Setting up homepage..."
# Copy README.md to Home.md for wiki homepage
if [ -f "README.md" ]; then
    cp "README.md" "$WIKI_DIR/Home.md"
    echo "✓ Created wiki homepage from README.md"
fi

echo "📁 Copying documentation files..."
# Copy root docs directory but handle code-docs specially
if [ -d "docs" ]; then
    # Copy everything except code-docs first
    find "docs" -mindepth 1 -not -path "docs/code-docs*" -exec cp -r {} "$WIKI_DIR/docs/" \;
    echo "✓ Copied root documentation (excluding code-docs)"
fi

# Function to convert file path to code-docs markdown filename
# e.g., apps/frontend/src/lib/db/commands/setAutoEval.ts -> lib.db.commands.setAutoEval.md
path_to_codedocs_name() {
    local filepath="$1"
    local app_name="$2"  # e.g., "frontend"

    # Remove the app prefix (e.g., apps/frontend/src/)
    local relative_path="${filepath#apps/${app_name}/src/}"

    # Convert path separators to dots and add .md extension
    echo "$relative_path" | sed 's/\//./g' | sed 's/\.(ts|tsx|js|jsx)$/.md/'
}

# Function to find which app a file belongs to
get_app_name() {
    local filepath="$1"

    if [[ "$filepath" =~ ^apps/([^/]+)/ ]]; then
        echo "${BASH_REMATCH[1]}"
    else
        echo ""
    fi
}

# Handle code-docs synchronization
echo "📚 Processing code-docs synchronization..."

if [ -d "docs/code-docs" ]; then
    # Ensure code-docs directory exists in wiki
    mkdir -p "$WIKI_DIR/docs/code-docs"

    # Always copy/update navigation files and media
    echo "📋 Updating navigation files and media..."
    if [ -f "docs/code-docs/_Sidebar.md" ]; then
        cp "docs/code-docs/_Sidebar.md" "$WIKI_DIR/docs/code-docs/"
        echo "✓ Updated _Sidebar.md"
    fi

    if [ -f "docs/code-docs/Home.md" ]; then
        cp "docs/code-docs/Home.md" "$WIKI_DIR/docs/code-docs/CodeDocsHome.md"
        echo "✓ Updated CodeDocsHome.md"
    fi

    if [ -d "docs/code-docs/_media" ]; then
        cp -r "docs/code-docs/_media" "$WIKI_DIR/docs/code-docs/"
        echo "✓ Updated media files"
    fi

    # Copy packages.md if it exists
    if [ -f "docs/code-docs/packages.md" ]; then
        cp "docs/code-docs/packages.md" "$WIKI_DIR/docs/code-docs/"
        echo "✓ Updated packages.md"
    fi

    # Get list of all current code-docs markdown files (ground truth)
    echo "🔍 Analyzing current code-docs structure..."
    CURRENT_CODEDOCS_FILES=$(find "docs/code-docs" -name "*.md" -not -name "_Sidebar.md" -not -name "Home.md" -not -name "packages.md" -type f | sort)

    # Get list of existing wiki code-docs files
    EXISTING_WIKI_CODEDOCS=()
    if [ "$CODE_DOCS_EXISTS" = true ]; then
        while IFS= read -r file; do
            if [ -n "$file" ]; then
                EXISTING_WIKI_CODEDOCS+=("$file")
            fi
        done < <(find "$WIKI_DIR/docs/code-docs" -name "*.md" -not -name "_Sidebar.md" -not -name "CodeDocsHome.md" -not -name "packages.md" -type f 2>/dev/null | sort || true)
    fi

    # Process enhanced files for selective updates
    ENHANCED_CODEDOCS_FILES=()
    if [ -n "$ENHANCED_FILES_LIST" ] && [ -f "$ENHANCED_FILES_LIST" ]; then
        echo "📝 Processing enhanced files list..."
        while IFS= read -r enhanced_file; do
            if [ -n "$enhanced_file" ]; then
                # Convert enhanced file path to expected code-docs filename
                app_name=$(get_app_name "$enhanced_file")
                if [ -n "$app_name" ]; then
                    codedocs_name=$(path_to_codedocs_name "$enhanced_file" "$app_name")
                    expected_codedocs_path="docs/code-docs/$codedocs_name"

                    # Check if this code-docs file actually exists
                    if [ -f "$expected_codedocs_path" ]; then
                        ENHANCED_CODEDOCS_FILES+=("$expected_codedocs_path")
                        echo "  ✓ Enhanced: $enhanced_file -> $codedocs_name"
                    fi
                fi
            fi
        done < "$ENHANCED_FILES_LIST"

        echo "📊 Found ${#ENHANCED_CODEDOCS_FILES[@]} enhanced code-docs files"
    else
        echo "⚠️ No enhanced files list provided, will sync all code-docs"
    fi

    # Copy/update code-docs files
    echo "🔄 Syncing code-docs files..."

    # Create arrays to track what we're doing
    COPIED_FILES=0
    UPDATED_FILES=0

    while IFS= read -r codedocs_file; do
        if [ -n "$codedocs_file" ]; then
            filename=$(basename "$codedocs_file")
            wiki_path="$WIKI_DIR/$codedocs_file"

            # Determine if this file should be updated
            SHOULD_UPDATE=false

            # Always update if no enhanced list provided
            if [ -z "$ENHANCED_FILES_LIST" ] || [ ! -f "$ENHANCED_FILES_LIST" ]; then
                SHOULD_UPDATE=true
            else
                # Update if this file was enhanced
                for enhanced_file in "${ENHANCED_CODEDOCS_FILES[@]}"; do
                    if [ "$codedocs_file" = "$enhanced_file" ]; then
                        SHOULD_UPDATE=true
                        break
                    fi
                done

                # Also update if the file doesn't exist in wiki yet
                if [ ! -f "$wiki_path" ]; then
                    SHOULD_UPDATE=true
                fi
            fi

            if [ "$SHOULD_UPDATE" = true ]; then
                # Ensure directory exists
                mkdir -p "$(dirname "$wiki_path")"

                if [ -f "$wiki_path" ]; then
                    cp "$codedocs_file" "$wiki_path"
                    UPDATED_FILES=$((UPDATED_FILES + 1))
                    echo "  ↻ Updated: $filename"
                else
                    cp "$codedocs_file" "$wiki_path"
                    COPIED_FILES=$((COPIED_FILES + 1))
                    echo "  + Added: $filename"
                fi
            else
                echo "  - Skipped: $filename (not enhanced)"
            fi
        fi
    done <<< "$CURRENT_CODEDOCS_FILES"

    # Remove wiki code-docs files that no longer exist in the source
    echo "🗑️ Removing obsolete code-docs files..."
    REMOVED_FILES=0

    for wiki_file in "${EXISTING_WIKI_CODEDOCS[@]}"; do
        # Convert wiki path to relative path for comparison
        relative_wiki_path="${wiki_file#$WIKI_DIR/}"

        # Check if this file still exists in current code-docs
        if [ ! -f "$relative_wiki_path" ]; then
            rm -f "$wiki_file"
            REMOVED_FILES=$((REMOVED_FILES + 1))
            echo "  - Removed: $(basename "$wiki_file")"
        fi
    done

    echo "✅ Code-docs sync complete:"
    echo "  📁 New files: $COPIED_FILES"
    echo "  ↻ Updated files: $UPDATED_FILES"
    echo "  🗑️ Removed files: $REMOVED_FILES"

else
    echo "⚠️ No code-docs directory found in source"
fi

# Copy package docs (unchanged)
if [ -d "apps" ]; then
    for package_dir in apps/*/; do
        if [ -d "${package_dir}docs" ]; then
            package_name=$(basename "$package_dir")
            mkdir -p "$WIKI_DIR/apps/$package_name"
            cp -r "${package_dir}docs" "$WIKI_DIR/apps/$package_name/"
            echo "✓ Copied $package_name documentation"
        fi
    done
fi

echo "🗂️ Generating sidebar..."
# Generate sidebar navigation
cat > "$WIKI_DIR/_Sidebar.md" << 'EOF'
## Navigation
- [Home](Home)
EOF

# Generate footer with home link
cat > "$WIKI_DIR/_Footer.md" << 'EOF'
---
[🏠 Back to Home](Home)
EOF

# Add root docs to sidebar
if [ -d "$WIKI_DIR/docs" ]; then
    echo "" >> "$WIKI_DIR/_Sidebar.md"
    echo "### Documentation" >> "$WIKI_DIR/_Sidebar.md"
    echo "" >> "$WIKI_DIR/_Sidebar.md"

    # Handle code-docs specially - link to CodeDocsHome
    if [ -d "$WIKI_DIR/docs/code-docs" ]; then
        echo "- [Code Documentation](CodeDocsHome)" >> "$WIKI_DIR/_Sidebar.md"
    fi

    # Find all other markdown files in docs (excluding code-docs subdirectory)
    find "$WIKI_DIR/docs" -name "*.md" -type f -not -path "$WIKI_DIR/docs/code-docs/*" | sort | while read -r file; do
        # Use just the filename without extension as the wiki page name
        name=$(basename "$file" .md)
        echo "- [$name]($name)" >> "$WIKI_DIR/_Sidebar.md"
    done
fi

# Add apps docs to sidebar
if [ -d "$WIKI_DIR/apps" ]; then
    echo "" >> "$WIKI_DIR/_Sidebar.md"
    echo "### Apps" >> "$WIKI_DIR/_Sidebar.md"
    for package_dir in "$WIKI_DIR/apps"/*/; do
        if [ -d "${package_dir}docs" ]; then
            package_name=$(basename "$package_dir")
            echo "" >> "$WIKI_DIR/_Sidebar.md"
            echo "#### $package_name" >> "$WIKI_DIR/_Sidebar.md"
            echo "" >> "$WIKI_DIR/_Sidebar.md"
            # Find all markdown files in package docs
            find "${package_dir}docs" -name "*.md" -type f | sort | while read -r file; do
                name=$(basename "$file" .md)
                echo "- [$name]($name)" >> "$WIKI_DIR/_Sidebar.md"
            done
        fi
    done
fi

echo "✓ Generated wiki sidebar"
echo "✅ Wiki sync completed!"

# Show what was synced
echo ""
echo "📊 Sync Summary:"
if [ -n "$ENHANCED_FILES_LIST" ] && [ -f "$ENHANCED_FILES_LIST" ]; then
    ENHANCED_COUNT=$(wc -l < "$ENHANCED_FILES_LIST" 2>/dev/null || echo "0")
    echo "- Enhanced files processed: $ENHANCED_COUNT"
fi
echo "- Total wiki files: $(find "$WIKI_DIR" -name "*.md" -not -name "_Sidebar.md" -not -name "_Footer.md" | wc -l)"
echo "- Sidebar entries: $(grep -c "^- \[" "$WIKI_DIR/_Sidebar.md" || echo "0")"
