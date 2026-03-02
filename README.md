🚀 TravelMate Git Workflow

🔧 1. Initial Setup
Create the development branch from main:

git checkout -b development
git push -u origin development


👨‍💻2. Daily Development Workflow
🔁 All day-to-day commits go to development.
📦 Create feature branches from development:

git checkout development
git pull origin development        # Always pull the latest
git checkout -b feature/something  # Create a new feature branch


🛠 Work on your feature:

# Make changes...
git add .
git commit -m "Add feature X"


🔄 3. Sync Your Feature with Latest Development
Before you open a pull request:


git checkout development
git pull origin development        # Get the latest development changes

git checkout feature/something
git merge development              # OR: git rebase development
# Resolve any merge conflicts
git push                           # Push updated feature branch


✅ Now your feature branch is up to date with development.

🚀 4. Push and Open a Pull Request

git push -u origin feature/something

Go to GitHub
Create a PR into development
Team leads can assign a different target branch if needed
Merge only after review and tests pass


✅ 5. Releasing to Production
When you're ready to release:


git checkout main
git pull origin main              # Ensure it's up to date
git merge development
git push origin main



This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
