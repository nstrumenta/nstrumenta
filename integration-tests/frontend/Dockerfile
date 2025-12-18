FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /tests

# Install dependencies
COPY package.json ./
RUN npm install

# Install Playwright browsers
RUN npx playwright install chromium

# Copy test files
COPY . .

CMD ["npm", "test"]
