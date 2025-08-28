#!/bin/bash
set -e

WIKI_DIR="wiki"
REPO_ROOT="."
ENRICHED_FILES_LIST="${ENRICHED_FILES_LIST:-/tmp/enriched_files.txt}"

echo "🧹 Cleaning wiki directory (preserving .git and code-docs)..."
# Clean wiki but keep .git and existing code-docs for selective sync
find "$WIKI_DIR" -mindepth 1 -not -path "$WIKI_DIR/.git*" -not -path "$WIKI_DIR/docs/code-docs*" -delete

echo "📄 Setting up homepage..."
# Copy README.md to Home.md for wiki homepage
if [ -f "README.md" ]; then
    cp "README.md" "$WIKI_DIR/Home.md"
    echo "✓ Created wiki homepage from README.md"
fi

echo "📁 Copying documentation files..."
# Copy root docs directory (excluding code-docs for now)
if [ -d "docs" ]; then
    # Create docs directory structure
    mkdir -p "$WIKI_DIR/docs"

    # Copy everything except code-docs first
    find "docs" -mindepth 1 -not -path "docs/code-docs*" -exec cp -r {} "$WIKI_DIR/docs/" \;

    echo "✓ Copied root documentation (excluding code-docs)"
fi

# Handle code-docs with selective sync
if [ -d "docs/code-docs" ]; then
    echo "🔄 Processing code-docs with selective sync..."

    WIKI_CODE_DOCS="$WIKI_DIR/docs/code-docs"
    SOURCE_CODE_DOCS="docs/code-docs"

    # Create code-docs directory if it doesn't exist
    mkdir -p "$WIKI_CODE_DOCS"

    # Always update navigation and media files
    echo "📋 Updating navigation and media files..."
    if [ -f "$SOURCE_CODE_DOCS/Home.md" ]; then
        cp "$SOURCE_CODE_DOCS/Home.md" "$WIKI_CODE_DOCS/CodeDocsHome.md"
        echo "✓ Updated CodeDocsHome.md"
    fi

    if [ -f "$SOURCE_CODE_DOCS/_Sidebar.md" ]; then
        cp "$SOURCE_CODE_DOCS/_Sidebar.md" "$WIKI_CODE_DOCS/"
        echo "✓ Updated _Sidebar.md"
    fi

    # Copy media directory
    if [ -d "$SOURCE_CODE_DOCS/_media" ]; then
        cp -r "$SOURCE_CODE_DOCS/_media" "$WIKI_CODE_DOCS/"
        echo "✓ Updated media files"
    fi

    # Get list of all current source files (ground truth)
    SOURCE_MD_FILES=$(find "$SOURCE_CODE_DOCS" -name "*.md" -not -name "Home.md" -not -name "_Sidebar.md" -type f)

    # Get list of enriched files (files that were enhanced with TSDoc)
    ENRICHED_FILES=""
    if [ -f "$ENRICHED_FILES_LIST" ]; then
        ENRICHED_FILES=$(cat "$ENRICHED_FILES_LIST")
        echo "📝 Found enriched files list with $(echo "$ENRICHED_FILES" | wc -l) files"
    else
        echo "⚠️  No enriched files list found at $ENRICHED_FILES_LIST"
        echo "   This means no files were enhanced with TSDoc in this run"
    fi

    # Function to check if a source path corresponds to an enriched file
    is_enriched() {
        local source_md_file="$1"

        # Convert source md file path to original source code path
        # Example: docs/code-docs/lib.db.commands.setAutoEval.md -> apps/frontend/src/lib/db/commands/setAutoEval.ts

        # Extract the base name without .md extension
        local base_name=$(basename "$source_md_file" .md)

        # Parse the typedoc naming convention
        # lib.db.commands.setAutoEval.md maps to lib/db/commands/setAutoEval.ts
        # Handle different patterns: Class.Name, Function.Name, Variable.Name, etc.

        local file_path=""
        if [[ "$base_name" == *"."* ]]; then
            # Convert dots to path separators, but handle special cases
            if [[ "$base_name" =~ ^(.+)\.(Class|Function|Variable|Interface|TypeAlias|Enumeration)\.(.+)$ ]]; then
                # Pattern: lib.db.commands.Function.setAutoEval
                local path_part="${BASH_REMATCH[1]}"
                local type_part="${BASH_REMATCH[2]}"
                local name_part="${BASH_REMATCH[3]}"
                file_path=$(echo "$path_part" | tr '.' '/')
            elif [[ "$base_name" =~ ^(.+)\.([^.]+)$ ]]; then
                # Pattern: lib.db.commands.setAutoEval (assuming last part is filename)
                local path_part="${BASH_REMATCH[1]}"
                local name_part="${BASH_REMATCH[2]}"
                file_path=$(echo "$path_part" | tr '.' '/')
            else
                # Simple case: just convert dots to slashes
                file_path=$(echo "$base_name" | tr '.' '/')
            fi
        else
            file_path="$base_name"
        fi

        # Check against enriched files list
        # Look for the file_path pattern in any of the enriched files
        if [ -n "$ENRICHED_FILES" ]; then
            echo "$ENRICHED_FILES" | grep -q "$file_path" && return 0
        fi

        return 1
    }

    # Process each source file
    echo "🔍 Processing code documentation files..."
    UPDATED_COUNT=0
    SKIPPED_COUNT=0

    for source_file in $SOURCE_MD_FILES; do
        wiki_file="$WIKI_CODE_DOCS/$(basename "$source_file")"

        if is_enriched "$source_file"; then
            # This file was enriched, so update it
            cp "$source_file" "$wiki_file"
            echo "✓ Updated (enriched): $(basename "$source_file")"
            ((UPDATED_COUNT++))
        else
            # This file wasn't enriched, only update if it doesn't exist in wiki
            if [ ! -f "$wiki_file" ]; then
                cp "$source_file" "$wiki_file"
                echo "✓ Added (new): $(basename "$source_file")"
                ((UPDATED_COUNT++))
            else
                echo "⏭️  Skipped (unchanged): $(basename "$source_file")"
                ((SKIPPED_COUNT++))
            fi
        fi
    done

    # Clean up obsolete files in wiki that no longer exist in source
    echo "🧹 Removing obsolete documentation files..."
    REMOVED_COUNT=0

    if [ -d "$WIKI_CODE_DOCS" ]; then
        # Get all existing wiki md files (excluding navigation files)
        EXISTING_WIKI_FILES=$(find "$WIKI_CODE_DOCS" -name "*.md" -not -name "CodeDocsHome.md" -not -name "_Sidebar.md" -type f)

        for wiki_file in $EXISTING_WIKI_FILES; do
            wiki_basename=$(basename "$wiki_file")
            source_file="$SOURCE_CODE_DOCS/$wiki_basename"

            if [ ! -f "$source_file" ]; then
                rm "$wiki_file"
                echo "🗑️  Removed obsolete: $wiki_basename"
                ((REMOVED_COUNT++))
            fi
        done
    fi

    echo "📊 Code-docs sync summary:"
    echo "   - Updated/Added: $UPDATED_COUNT files"
    echo "   - Skipped (unchanged): $SKIPPED_COUNT files"
    echo "   - Removed (obsolete): $REMOVED_COUNT files"
fi

# Copy package docs (unchanged from original)
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
if [ -d "docs" ]; then
    echo "" >> "$WIKI_DIR/_Sidebar.md"
    echo "### Documentation" >> "$WIKI_DIR/_Sidebar.md"
    echo "" >> "$WIKI_DIR/_Sidebar.md"
    # Handle code-docs specially - link to apps page
    if [ -d "docs/code-docs" ]; then
        echo "- [Code Documentation](CodeDocsHome)" >> "$WIKI_DIR/_Sidebar.md"
    fi
    # Find all other markdown files in docs (excluding code-docs subdirectory)
    find "docs" -name "*.md" -type f -not -path "docs/code-docs/*" | sort | while read -r file; do
        # Use just the filename without extension as the wiki page name
        name=$(basename "$file" .md)
        echo "- [$name]($name)" >> "$WIKI_DIR/_Sidebar.md"
    done
fi

# Add apps docs to sidebar
if [ -d "apps" ]; then
    echo "" >> "$WIKI_DIR/_Sidebar.md"
    echo "### Apps" >> "$WIKI_DIR/_Sidebar.md"
    for package_dir in apps/*/; do
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
echo "📊 Overall Sync Summary:"
echo "- Total files synced: $(find "$WIKI_DIR" -name "*.md" -not -name "_Sidebar.md" | wc -l)"
echo "- Sidebar entries: $(grep -c "^- \[" "$WIKI_DIR/_Sidebar.md" || echo "0")"
