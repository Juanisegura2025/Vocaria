# Windsurf AI Development Rules - Vocaria Project

**Version:** 2.0  
**Last Updated:** 1 Junio 2025  
**Project:** Vocaria SaaS Inmobiliario  

---

## 🎯 **CORE DEVELOPMENT PRINCIPLES**

### **✅ PROVEN WINNERS (Keep Always)**

#### **🔧 Development Workflow**
- **Always prefer simple solutions** - Complexity is the enemy of stability
- **Look for existing code to iterate on instead of creating new code** - Build on proven foundations
- **Focus on the areas of code relevant to the task** - Avoid scope creep and unrelated changes
- **Keep the codebase very clean and organized** - Maintainability over cleverness
- **Avoid having files over 200-300 lines of code** - Refactor when hitting this threshold

#### **🛡️ Safety & Security**  
- **Never overwrite .env file without first asking and confirming** - Critical for environment security
- **Write code that takes into account different environments: dev, test, and prod** - Environment-aware development
- **Never add stubbing or fake data patterns to code that affects dev or prod environments** - Keep test data in tests only

#### **🎨 Code Quality**
- **Avoid duplication of code whenever possible** - BUT only after patterns are proven stable
- **Write thorough tests for all major functionality** - Quality assurance is non-negotiable
- **You are careful to only make changes that are requested or well understood** - Precision over assumptions

---

## 🔄 **EVOLVED RULES (Improved from Experience)**

#### **🏗️ Architecture & Patterns**
- **Prefer existing patterns, but allow simple new patterns for proven stability** *(Modified)*
  - OLD: "Do not introduce new patterns without exhausting existing options"
  - NEW: Balance between consistency and pragmatic solutions
  - EXAMPLE: Tailwind utilities over custom CSS when custom classes cause conflicts

- **Avoid major changes to proven patterns unless explicitly instructed** *(Refined)*
  - Apply after features show stability (not during initial development)
  - Allow iterative improvements on working foundations

#### **🖥️ Server Management**
- **Restart servers only for dependency, environment, or configuration changes** *(Optimized)*
  - OLD: "Always restart server after changes"  
  - NEW: Trust hot reload for code changes, restart only when necessary
  - SAVES: Development time and maintains flow state

#### **🔄 Bug Fixing Strategy**
- **When fixing issues, exhaust existing implementation options first** *(Clarified)*
  - If new patterns are needed, remove old implementation afterward
  - Document the reasoning for pattern changes
  - Ensure no duplicate logic remains

---

## 🆕 **CRITICAL NEW RULES (Gaps Filled)**

### **🎨 Styling & Design**
- **For styling: Prefer Tailwind utilities + inline styles over custom CSS classes until patterns are proven stable**
  - REASON: Custom CSS classes can cause import/layout conflicts
  - APPROACH: Start functional → identify patterns → extract components
  - EXAMPLE: `style={{background: 'linear-gradient(...)'}}` over `.custom-gradient`

- **When making design changes, make incremental changes and test each step**
  - One visual change at a time
  - Validate in browser before proceeding
  - Commit working states frequently

- **Preserve working functionality when making visual improvements**
  - Visual polish should never break existing features
  - Test critical user flows after styling changes
  - Rollback specific elements if functionality breaks

### **🧩 Component Architecture**
- **When extracting components, ensure TypeScript types are properly defined upfront**
  - REASON: Import/export errors are harder to debug later
  - INCLUDE: Props interfaces, proper exports, type safety
  - VALIDATE: Import works before moving to next feature

- **Always verify imports/exports work before moving to next feature**
  - Test component imports in browser
  - Check for TypeScript errors
  - Validate no circular dependencies

- **For auth and core functionality, prioritize functional over beautiful until baseline is established**
  - Get it working reliably first
  - Add premium styling after stability proven
  - Separate concerns: functionality vs. aesthetics

### **🔧 Debugging & Rollback Strategy**
- **When debugging styling issues, isolate to specific CSS/component before broad changes**
  - Don't change multiple styling systems simultaneously
  - Use browser DevTools to identify specific issues
  - Test fixes incrementally

- **Use git rollback for specific files rather than full project rollbacks**
  - `git checkout HEAD -- specific/file.tsx` over full project reset
  - Preserve working parts while fixing broken parts
  - Document what was rolled back and why

- **For complex UI changes, break into smaller commits for easier rollback**
  - One feature per commit
  - Descriptive commit messages
  - Tag stable states for easy reference

### **📊 Performance & Quality**
- **Always maintain consistent spacing and visual hierarchy when making design changes**
  - Use design system tokens consistently
  - Respect established spacing patterns
  - Validate responsive behavior

- **Test critical user flows after each major styling change**
  - Login/logout flow
  - Navigation between pages  
  - Form submissions
  - API integrations

- **Document component props and usage patterns when extracting reusable components**
  - Clear TypeScript interfaces
  - Usage examples in comments
  - Props validation where appropriate

---

## 🚨 **CRITICAL DON'TS (Learned from Pain)**

### **❌ Styling Pitfalls**
- **DON'T:** Create complex custom CSS class hierarchies without proven need
- **DON'T:** Mix multiple styling approaches in single component without clear strategy
- **DON'T:** Override Antd styling without understanding cascading effects
- **DON'T:** Change entire design system when single component issue exists

### **❌ Component Architecture Pitfalls**  
- **DON'T:** Extract components prematurely before patterns are clear
- **DON'T:** Create component abstractions that are harder to debug than inline code
- **DON'T:** Ignore TypeScript errors during component development
- **DON'T:** Create component dependencies that cause circular imports

### **❌ Development Flow Pitfalls**
- **DON'T:** Make large architectural changes without clear rollback plan
- **DON'T:** Modify multiple core systems simultaneously
- **DON'T:** Skip testing after "small" changes that affect user flows
- **DON'T:** Ignore console errors even if functionality appears to work

---

## 🔄 **DEVELOPMENT WORKFLOW (Best Practices)**

### **1. Starting New Features**
```
1. Understand existing codebase patterns
2. Start with simplest possible implementation  
3. Get it working functionally first
4. Test core functionality thoroughly
5. Commit working baseline
6. Add styling/polish incrementally
7. Extract reusable patterns after proven stability
```

### **2. Debugging Issues**
```
1. Identify specific broken component/function
2. Check browser console for exact errors
3. Use git to isolate when issue was introduced
4. Fix one issue at a time
5. Test fix before moving to next issue
6. Use specific rollbacks, not full project resets
```

### **3. Making Design Changes**
```
1. Preserve working functionality as base
2. Make one visual change at a time
3. Test in browser immediately
4. Use design system tokens consistently
5. Commit working visual improvements
6. Extract patterns after multiple uses proven
```

### **4. Component Development**
```
1. Define TypeScript interfaces first
2. Implement basic functionality
3. Test imports/exports work correctly
4. Add error handling and edge cases
5. Document props and usage patterns
6. Test in multiple contexts before extraction
```

---

## 📋 **PRE-COMMIT CHECKLIST**

### **✅ Before Every Commit:**
- [ ] No TypeScript errors in terminal
- [ ] No console errors in browser
- [ ] Critical user flows still work
- [ ] Changes are focused and relevant to task
- [ ] Commit message clearly describes what changed

### **✅ Before Major Changes:**
- [ ] Current state is working and committed
- [ ] Understand rollback strategy if needed
- [ ] Have tested similar changes in isolation
- [ ] Know which specific files will be affected

### **✅ Before Component Extraction:**
- [ ] Pattern has been used successfully 2+ times
- [ ] TypeScript interfaces are clearly defined
- [ ] Component has clear single responsibility
- [ ] Usage examples are documented
- [ ] No circular dependencies created

---

## 🎯 **WINDSURF PROMPT TEMPLATE**

### **For Complex Changes:**
```
CONTEXT: [Brief project context]
CURRENT STATE: [What's working now]
OBJECTIVE: [Specific goal]
CONSTRAINTS: [What must be preserved]
APPROACH: [Preferred strategy - incremental vs. replacement]
VALIDATION: [How to test success]
ROLLBACK PLAN: [What to preserve if changes fail]
```

### **For Styling Changes:**
```
STYLING CONTEXT: [Current design system status]
VISUAL GOAL: [Specific aesthetic target]
FUNCTIONAL REQUIREMENTS: [What must keep working]
PREFERRED APPROACH: [Tailwind utilities vs. components vs. inline styles]
TESTING STEPS: [How to verify visual + functional success]
```

### **For Component Work:**
```
COMPONENT CONTEXT: [Existing component patterns]
EXTRACTION GOAL: [What pattern to extract]
TYPESCRIPT REQUIREMENTS: [Interface definitions needed]
USAGE PATTERNS: [Where component will be used]
SUCCESS CRITERIA: [How to validate component works correctly]
```

---

## 🔍 **DEBUGGING DECISION TREE**

### **When Something Breaks:**
```
1. IS IT A STYLING ISSUE?
   → Check browser DevTools console
   → Look for CSS conflicts or missing imports
   → Test with inline styles to isolate problem
   → Use specific git rollback for styling files

2. IS IT A COMPONENT IMPORT ERROR?
   → Check TypeScript errors in terminal
   → Verify export/import syntax
   → Test component isolation
   → Rollback component files specifically

3. IS IT AN API/BACKEND ISSUE?
   → Check network tab in DevTools
   → Verify server is running on correct port
   → Test API endpoints with curl
   → Check backend logs for errors

4. IS IT A GENERAL FUNCTIONALITY BREAK?
   → Identify last working commit
   → Use git bisect to find breaking change
   → Test incremental rollbacks
   → Isolate specific broken functionality
```

---

## 📚 **REFERENCES & EXAMPLES**

### **Successful Patterns:**
- **Auth Flow Development:** Functional baseline → visual polish → component extraction
- **Design System Implementation:** CSS variables → utilities → components
- **Error Recovery:** Specific file rollbacks → incremental fixes → stable state

### **Anti-Patterns Avoided:**
- **Premature Component Extraction:** Led to import/export complexity
- **All-at-Once Design Changes:** Caused difficult debugging scenarios
- **Custom CSS Class Overuse:** Created styling conflicts and maintenance burden

### **Tools & Commands:**
```bash
# Specific file rollback
git checkout HEAD -- path/to/specific/file.tsx

# Tag stable states  
git tag v[version]-[milestone]

# Check TypeScript errors
npx tsc --noEmit

# Validate design system
getComputedStyle(document.documentElement).getPropertyValue('--primary')
```

---

**📋 Remember: These rules evolved from real project experience. They prioritize maintainability, debuggability, and developer sanity over theoretical perfection.**

**🎯 Goal: Enable fast, reliable development while maintaining high code quality and user experience.**