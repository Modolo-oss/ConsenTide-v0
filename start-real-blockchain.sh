#!/bin/bash

echo "🚀 Setting up REAL BLOCKCHAIN MODE for ConsenTide"
echo "================================================"
echo ""

# Check if environment variables are set
REQUIRED_VARS=(
    "CONSTELLATION_PRIVATE_KEY"
    "CONSTELLATION_PUBLIC_KEY"
    "CONSTELLATION_WALLET_ADDRESS"
)

echo "Checking required environment variables:"
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ $var: NOT SET"
        MISSING_VARS+=("$var")
    else
        # Show first 10 chars for security
        VALUE="${!var}"
        SHORT_VALUE="${VALUE:0:10}..."
        echo "✅ $var: $SHORT_VALUE"
    fi
done

echo ""
if [ ${#MISSING_VARS[@]} -eq 0 ]; then
    echo "✅ All required environment variables are set!"
    echo ""
    echo "🚀 Starting backend in REAL BLOCKCHAIN MODE..."
    echo "   - No demo transactions"
    echo "   - Real Constellation Mainnet anchoring"
    echo "   - All consents will be blockchain-anchored"
    echo ""

    # Force real transactions mode
    export FORCE_REAL_TRANSACTIONS=true

    # Start the backend
    cd backend && npm run dev
else
    echo "❌ MISSING REQUIRED ENVIRONMENT VARIABLES:"
    echo ""
    echo "Please set these environment variables for REAL BLOCKCHAIN MODE:"
    echo ""

    for var in "${MISSING_VARS[@]}"; do
        echo "export $var='your_$var_here'"
    done

    echo ""
    echo "📖 Instructions:"
    echo "1. Get your Constellation wallet credentials"
    echo "2. Set the environment variables above"
    echo "3. Run this script again"
    echo ""
    echo "⚠️  WITHOUT THESE VARIABLES, THE SYSTEM WILL FAIL TO START"
    echo "   NO DEMO MODE - REAL BLOCKCHAIN ONLY!"
    echo ""
    exit 1
fi
