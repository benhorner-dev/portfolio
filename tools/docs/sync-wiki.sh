#!/bin/bash

set -e

WIKI_DIR="wiki"
REPO_ROOT="."

echo "🧹 Cleaning wiki directory..."
# Clean wiki but keep .git
find "$WIKI_DIR" -mindepth 1 -not -path "$WIKI_DIR/.git*" -delete

echo "📄 Setting up homepage..."
# Copy README.md to Home.md for wiki homepage
if [ -f "README.md" ]; then
    cp "README.md" "$WIKI_DIR/Home.md"
    echo "✓ Created wiki homepage from README.md"
fi

echo "📁 Copying documentation files..."

# Copy root docs directory
if [ -d "docs" ]; then
    cp -r "docs" "$WIKI_DIR/"
    echo "✓ Copied root documentation"
fi

# Copy package docs
if [ -d "packages" ]; then
    for package_dir in packages/*/; do
        if [ -d "${package_dir}docs" ]; then
            package_name=$(basename "$package_dir")
            mkdir -p "$WIKI_DIR/packages/$package_name"
            cp -r "${package_dir}docs" "$WIKI_DIR/packages/$package_name/"
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
    
    # Handle code-docs specially - link to packages page
    if [ -d "docs/code-docs" ]; then
        echo "- [Code Documentation](packages)" >> "$WIKI_DIR/_Sidebar.md"
    fi
    
    # Find all other markdown files in docs (excluding code-docs subdirectory)
    find "docs" -name "*.md" -type f -not -path "docs/code-docs/*" | sort | while read -r file; do
        # Use just the filename without extension as the wiki page name
        name=$(basename "$file" .md)
        echo "- [$name]($name)" >> "$WIKI_DIR/_Sidebar.md"
    done
fi

# Add package docs to sidebar
if [ -d "packages" ]; then
    echo "" >> "$WIKI_DIR/_Sidebar.md"
    echo "### Packages" >> "$WIKI_DIR/_Sidebar.md"
    
    for package_dir in packages/*/; do
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
echo "- Files synced: $(find "$WIKI_DIR" -name "*.md" -not -name "_Sidebar.md" | wc -l)"
echo "- Sidebar entries: $(grep -c "^- \[" "$WIKI_DIR/_Sidebar.md" || echo "0")"