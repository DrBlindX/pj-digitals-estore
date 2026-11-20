# NearBy development workflow

- Build/test working copy: `D:\PJ Client`.
- Original Git repository: `E:\Documents\Codex\2026-10-15\PJ NEW\pj-digitals-estore`.
- For future edits, make and test changes in the build/test copy first.
- After testing, summarize the changes, ask the user for permission before copying them into the original Git folder, and remind the user that they can commit/push after the approved copy is complete.
- Never transfer future changes to the original Git folder automatically without that permission. Current permission applies only to the transfer requested on 20 November 2026.
- Do not commit or push unless explicitly requested.
- Transfer portable application source, shared modules, dependency manifests/lockfiles and config plugins. Preserve unrelated user edits; inspect Git status and compare before copying.
- Do not copy build outputs, APKs, dependency folders, local environment secrets, machine-specific SDK/JDK paths or dependency junctions into Git.
- Do not modify backend code unless explicitly requested.
