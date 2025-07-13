# 🚀 FlowPilot Development Workflow

## Quick Start Commands
```bash
task-master next                    # See what to work on next
task-master show <id>              # View specific task details  
task-master list                   # See all tasks overview
```

## 📋 Daily Development Process

### **1. Starting a Coding Session**
```bash
task-master next                    # Check what's next to work on
task-master show <id>              # Get detailed task instructions
task-master set-status --id=<id> --status=in-progress  # Mark as started
```

### **2. During Development**
- **Code the feature** following the task details
- **Test frequently** as you build
- **Log progress**: 
```bash
task-master update-subtask --id=<subtask-id> --prompt="What I discovered/learned"
```

### **3. Completing Tasks**
```bash
task-master set-status --id=<id> --status=done     # Mark task complete
git add .                                          # Stage changes
git commit -m "feat: descriptive message"         # Commit with clear message
git push                                           # Push to GitHub
```

## 🎯 Task Status Reference
- **pending**: Ready to work on
- **in-progress**: Currently working on it  
- **done**: Completed and tested
- **blocked**: Waiting for dependency

## 🔄 Complete Session Flow
1. `task-master next` → See what to work on
2. `task-master set-status --id=X --status=in-progress` → Mark started
3. **Code the feature** (with Claude's help!)
4. `task-master update-subtask --id=X.Y --prompt="progress notes"` → Log discoveries
5. **Test the feature** works correctly
6. `task-master set-status --id=X --status=done` → Mark complete
7. `git add . && git commit -m "feat: description" && git push` → Save to GitHub
8. **Repeat!**

## 💡 Pro Tips
- **Update progress frequently** - Don't wait until the end
- **Commit often** - Small, focused commits are better  
- **Test as you go** - Don't build everything then test
- **Ask Claude for help** - I'm here for any coding challenges!

## 🆘 When You Need Help - Just Ask:
- "What should I work on next?"
- "Help me commit my changes"  
- "Update my task progress"
- "I'm stuck on this task"
- "Show me the next step"

## 📊 Current Project Status
- **Repository**: https://github.com/Franksami/Flowpilot
- **Tasks**: 15 main tasks with 36+ subtasks
- **Next Task**: #1 - Setup Project Repository (Ready to start!)

---
*🤖 Remember: This is collaborative! You focus on coding, Claude handles workflow management.*
