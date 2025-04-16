FROM node:16

WORKDIR /app

# Step 3: Copy the package.json and package-lock.json files
COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
