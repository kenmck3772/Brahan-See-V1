#!/bin/bash

# --- Brahan Personal Terminal: Forensic Test Orchestrator ---
# This script handles the environment setup and execution of the Playwright suite.

# Color definitions for terminal output
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}>>> INITIATING FORENSIC TEST PIPELINE: BRAHAN_TERMINAL_v2.5${NC}"

# 1. Dependency Check & Installation
echo -e "${YELLOW}>> STEP 1: VERIFYING NODE DEPENDENCIES...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}ERR: Dependency installation failed.${NC}"
    exit 1
fi

# 2. Playwright Browser Setup
echo -e "${YELLOW}>> STEP 2: INSTALLING PLAYWRIGHT BROWSERS...${NC}"
npx playwright install --with-deps chromium
if [ $? -ne 0 ]; then
    echo -e "${RED}ERR: Playwright browser setup failed.${NC}"
    exit 1
fi

# 3. Start Development Server
echo -e "${YELLOW}>> STEP 3: LAUNCHING TERMINAL SERVER IN BACKGROUND...${NC}"
# We assume the user environment has a standard 'dev' script. 
# We'll use a tool like wait-on to ensure the server is ready.
npm run dev &
SERVER_PID=$!

# Use npx wait-on to wait for port 3000 (standard for most dev servers)
echo -e "${CYAN}>> WAITING FOR HANDSHAKE ON PORT 3000...${NC}"
npx wait-on http://localhost:3000 -t 60000

if [ $? -ne 0 ]; then
    echo -e "${RED}ERR: Server timeout. Handshake failed.${NC}"
    kill $SERVER_PID
    exit 1
fi

# 4. Execute Playwright Tests
echo -e "${GREEN}>> STEP 4: EXECUTING FORENSIC DEMONSTRATION SUITE...${NC}"
npx playwright test brahan-demo.spec.ts --project=chromium --reporter=list,html

TEST_EXIT_CODE=$?

# 5. Cleanup & Reporting
echo -e "${YELLOW}>> STEP 5: DE-ESCALATING SERVER PRIVILEGES...${NC}"
kill $SERVER_PID

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}>>> SUCCESS: ALL FORENSIC VECTORS VERIFIED.${NC}"
    echo -e "${CYAN}Review the report at: playwright-report/index.html${NC}"
else
    echo -e "${RED}>>> CRITICAL: FORENSIC PIPELINE BREACHED. REVIEW LOGS.${NC}"
fi

exit $TEST_EXIT_CODE
