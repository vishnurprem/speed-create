// Build the site and publish dist/ to the gh-pages branch (GitHub Pages serves it).
import { execSync } from 'node:child_process'
import { writeFileSync, rmSync } from 'node:fs'

const run = (cmd, cwd) => execSync(cmd, { stdio: 'inherit', cwd })
const remote = execSync('git remote get-url origin').toString().trim()

run('npx tsc -b')
run('npx vite build --base=/speed-create/')
writeFileSync('dist/.nojekyll', '')
rmSync('dist/.git', { recursive: true, force: true })
run('git init -b gh-pages', 'dist')
run('git add -A', 'dist')
run('git -c user.name="vishnurprem" -c user.email="vishnurprem@users.noreply.github.com" commit -m "Deploy site"', 'dist')
run(`git push -f ${remote} gh-pages`, 'dist')
rmSync('dist/.git', { recursive: true, force: true })
console.log('\nPublished to gh-pages')
