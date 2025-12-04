#!/bin/bash

# Script untuk membersihkan disk Mac
# PERINGATAN: Akan menghapus cache dan file temporary

echo "🧹 MEMBERSIHKAN DISK MAC"
echo "========================"
echo ""

# Fungsi untuk mendapatkan ukuran folder
get_size() {
    if [ -d "$1" ]; then
        du -sh "$1" 2>/dev/null | awk '{print $1}'
    else
        echo "0B"
    fi
}

# 1. Bersihkan CocoaPods Cache
echo "1️⃣ CocoaPods Cache"
COCOAPODS_SIZE=$(get_size ~/Library/Caches/CocoaPods)
echo "   Ukuran: $COCOAPODS_SIZE"
if [ -d ~/Library/Caches/CocoaPods ]; then
    rm -rf ~/Library/Caches/CocoaPods
    echo "   ✅ Dihapus"
else
    echo "   ℹ️  Tidak ada cache"
fi
echo ""

# 2. Bersihkan Xcode Derived Data
echo "2️⃣ Xcode Derived Data"
XCODE_SIZE=$(get_size ~/Library/Developer/Xcode/DerivedData)
echo "   Ukuran: $XCODE_SIZE"
if [ -d ~/Library/Developer/Xcode/DerivedData ]; then
    rm -rf ~/Library/Developer/Xcode/DerivedData
    echo "   ✅ Dihapus"
else
    echo "   ℹ️  Tidak ada data"
fi
echo ""

# 3. Bersihkan npm cache
echo "3️⃣ npm Cache"
NPM_SIZE=$(get_size ~/.npm)
echo "   Ukuran: $NPM_SIZE"
npm cache clean --force 2>/dev/null
echo "   ✅ Dibersihkan"
echo ""

# 4. Bersihkan Expo cache
echo "4️⃣ Expo Cache"
EXPO_SIZE=$(get_size ~/.expo)
echo "   Ukuran: $EXPO_SIZE"
if [ -d ~/.expo/ios-simulator-app-cache ]; then
    rm -rf ~/.expo/ios-simulator-app-cache
    echo "   ✅ Simulator cache dihapus"
fi
echo ""

# 5. Bersihkan Homebrew cache
echo "5️⃣ Homebrew Cache"
if command -v brew &> /dev/null; then
    BREW_SIZE=$(brew cleanup --prune=all -n 2>/dev/null | grep "free up" | awk '{print $NF}')
    echo "   Akan dibebaskan: $BREW_SIZE"
    brew cleanup --prune=all -s 2>/dev/null
    echo "   ✅ Dibersihkan"
else
    echo "   ℹ️  Homebrew tidak terinstall"
fi
echo ""

# 6. Bersihkan Trash
echo "6️⃣ Empty Trash"
TRASH_SIZE=$(get_size ~/.Trash)
echo "   Ukuran: $TRASH_SIZE"
rm -rf ~/.Trash/*
echo "   ✅ Dikosongkan"
echo ""

echo "========================"
echo "✅ SELESAI!"
echo ""
echo "Cek space yang tersedia:"
df -h / | grep -E 'Filesystem|/dev/'
