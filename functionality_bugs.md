# BugNest — Functionality Bugs (Deep Dive)

> All bugs traced to exact file + line. Severity: 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low

---

## 🔴 CRITICAL — Breaks Core Functionality

---

### BUG-F01 · Developer/Tester Cannot See Bugs on the Bugs Page
**File:** [BugService.java](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/src/main/java/org/miniproject/BugNest/service/BugService.java) L48–52 + [Bugs.jsx](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/frontend/src/pages/Bugs.jsx) L87–90  
**Type:** Wrong logic — visibility rule breaks search

**Problem:**  
In [getBugsByProject()](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/src/main/java/org/miniproject/BugNest/service/BugService.java#35-58), Developers and Testers are filtered to **only see bugs assigned to them**. However, on the `/bugs` page in [Bugs.jsx](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/frontend/src/pages/Bugs.jsx), when in "Global Bugs" mode (no project selected), the search filter runs `b.bugId.toLowerCase()` on the same list. If a Developer is in the project but has 0 bugs assigned, the list is empty and the page shows "No bugs found" — even though bugs exist.

More critically: a Developer opening a **specific project** (`/projects/:id/bugs`) also sees nothing if they have no bugs assigned yet, which looks like the project is empty rather than the feature being restricted.

**Fix:** Show a message: *"Only your assigned bugs are shown"* instead of the generic empty state.

---

### BUG-F02 · [getAccessibleBug()](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/src/main/java/org/miniproject/BugNest/service/BugService.java#311-333) Blocks Developer/Tester from Commenting on Their Own Assigned Bugs
**File:** [BugService.java](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/src/main/java/org/miniproject/BugNest/service/BugService.java) L325–328  
**Type:** Logic flaw — access control too strict

**Problem:**  
```java
if (user.getRole() == Role.DEVELOPER || user.getRole() == Role.TESTER) {
    if (bug.getAssignee() == null || !bug.getAssignee().getId().equals(user.getId())) {
        throw new RuntimeException("Access denied: You can only access bugs assigned to you");
    }
}
```
[getAccessibleBug()](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/src/main/java/org/miniproject/BugNest/service/BugService.java#311-333) is used for **both** reading bugs AND for [addComment()](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/src/main/java/org/miniproject/BugNest/service/BugService.java#71-87) and [addAttachment()](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/src/main/java/org/miniproject/BugNest/service/BugService.java#95-115). So if a Developer is the **creator** of a bug but it's been **reassigned to someone else**, they:
- Cannot view the bug detail page
- Cannot comment on their own bug
- Cannot see attachments they uploaded

A developer should always be able to at least **view** bugs they created.

**Fix:** Add `|| bug.getCreator().getId().equals(user.getId())` to the access check.

---

### BUG-F03 · Bug ID Generation is NOT Thread-Safe (Race Condition)
**File:** [BugService.java](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/src/main/java/org/miniproject/BugNest/service/BugService.java) L179–180  
**Type:** Concurrency bug — data integrity

**Problem:**  
```java
long count = bugRepository.countByProject(project);
bug.setBugId(project.getProjectKey() + "-" + (count + 1));
```
If two users submit bugs at the exact same time, both read `count = 5`, both set `bugId = "KEY-6"` → **duplicate bug IDs** in the database. The `@Transactional` annotation does NOT prevent this because the read and the write are two separate DB operations.

**Fix:** Use a database sequence or a `@Column(unique=true)` constraint and handle `DataIntegrityViolationException` with a retry.

---

### BUG-F04 · [autoAttachToProjects()](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/src/main/java/org/miniproject/BugNest/service/UserService.java#91-102) Silently Auto-Accepts Invitations Without User Consent
**File:** [UserService.java](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/src/main/java/org/miniproject/BugNest/service/UserService.java) L91–101  
**Type:** Business logic flaw — security/privacy

**Problem:**  
```java
private void autoAttachToProjects(User user) {
    ...
    member.setStatus(ProjectMemberStatus.ACCEPTED); // ← Auto-accepts!
    member.setJoinedAt(LocalDateTime.now());
```
When a new user registers with an email that already has a pending invitation, the system **automatically accepts** that invite and adds them to the project — without the user knowing or agreeing. The user never sees an "Accept/Reject" prompt for those projects.

**Fix:** Only link the [User](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/src/main/java/org/miniproject/BugNest/service/UserService.java#64-87) object to the existing [ProjectMember](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/src/main/java/org/miniproject/BugNest/service/ProjectService.java#72-80) record (so they can see the invite), but keep status as `PENDING`. Let the user accept/reject from the Invitations page.

---

### BUG-F05 · Edit Bug Modal Sends TWO Conflicting API Calls for Status Change
**File:** [Bugs.jsx](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/frontend/src/pages/Bugs.jsx) L320–329  
**Type:** Race condition — state corruption

**Problem:**  
```js
const updates = [
    axios.put(`/api/bugs/${bug.id}`, payload, ...)  // PUT #1: updates all fields
];
if (formData.status !== bug.status) {
    updates.push(axios.put(`/api/bugs/${bug.id}/status?status=...`, ...)) // PUT #2: updates status only
}
await Promise.all(updates);  // Both run simultaneously!
```
`PUT /bugs/{id}` updates title, description, priority, and assignee — but [updateBug()](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/src/main/java/org/miniproject/BugNest/controller/BugController.java#115-125) in the service does **NOT** update the status field. So the second call is intended to handle status. However:
- Both requests hit the DB simultaneously
- The first can overwrite an intermediate state set by the second
- The response from one may complete after the other, causing stale UI

**Fix:** Merge status into the main [updateBug()](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/src/main/java/org/miniproject/BugNest/controller/BugController.java#115-125) service method. Remove the parallel status-update call.

---

## 🟠 HIGH — Significant Feature Broken

---

### BUG-F06 · [MyAssignedBugs](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/frontend/src/pages/MyAssignedBugs.jsx#7-129) Page Shows All Project Bugs, Not Just Assigned
**File:** [MyAssignedBugs.jsx](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/frontend/src/pages/MyAssignedBugs.jsx) L18  
**Type:** Wrong API call

**Problem:**  
```js
const res = await axios.get("http://localhost:8080/api/bugs", ...);
```
The page title says "My Assigned Bugs" but it calls `/api/bugs` which, per `BugService.getAllBugsForUser()`, already filters by the DEVELOPER/TESTER's assigned bugs. **This part actually works correctly on backend.** However, there is no client-side re-filter, so if the backend logic changes, this page breaks silently. Also, a **PROJECT_MANAGER** role is excluded from this route ([App.jsx](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/frontend/src/App.jsx) L200) but they can have bugs assigned to them too — they'll never see those.

---

### BUG-F07 · [TopNavbar](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/frontend/src/components/TopNavbar.jsx#32-169) Displays `user?.sub` as Name (Wrong JWT Claim)
**File:** [TopNavbar.jsx](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/frontend/src/components/TopNavbar.jsx) L39  
**Type:** Wrong field access — UI displays broken value

**Problem:**  
```js
const displayName = user?.sub || user?.email || "User";
```
JWT tokens from Spring Boot (via `JwtUtils.generateJwtToken`) set the subject (`sub`) to the **email**, not the user's real name. So `user?.sub` will show the email address as the user's display name in the top navbar. The actual `name` field is never included in the JWT token, so it's never available via `user`.

**Fix:** Either include `name` as a custom claim in the JWT, or fetch user profile on login and store it in `AuthContext`.

---

### BUG-F08 · Notifications Dropdown Shows Invite Project Name as Nothing
**File:** [TopNavbar.jsx](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/frontend/src/components/TopNavbar.jsx) L116  
**Type:** Missing data in notification UI

**Problem:**  
```jsx
<p>You've been invited to join as <strong>{invite.role}</strong></p>
```
The notification says "You've been invited to join as DEVELOPER" — but which project? The [invite](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/src/main/java/org/miniproject/BugNest/controller/ProjectController.java#54-64) object from `GET /api/projects/invites` contains `ProjectMemberResponse` which has `role` but the **project name is never shown** in the dropdown. A user with 3 invites from different projects cannot tell which is which.

**Fix:** Include `projectName` in `ProjectMemberResponse` and display it in the notification.

---

### BUG-F09 · Tester Status Transition Logic Is Inconsistent Between Frontend and Backend
**File:** [BugDetail.jsx](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/frontend/src/pages/BugDetail.jsx) L63–65 (frontend) vs [BugService.java](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/src/main/java/org/miniproject/BugNest/service/BugService.java) L201–211 (backend)  
**Type:** Frontend/Backend mismatch

**Problem — Frontend:**
```js
if (role === "TESTER") {
    const base = ["TESTING", "CLOSED"];
    if (bug?.status === "CLOSED") base.unshift("OPEN");
    return base;
}
```

**Problem — Backend:**
```java
} else if (user.getRole() == Role.TESTER) {
    if (newStatus == BugStatus.TESTING || newStatus == BugStatus.CLOSED) {
        bug.setStatus(newStatus);
    } else if (newStatus == BugStatus.OPEN) {
        if (bug.getStatus() != BugStatus.CLOSED) {
            throw new RuntimeException("Reopen is only allowed from Closed");
```

The frontend shows `["TESTING", "CLOSED"]` always (plus `OPEN` when closed). But the backend allows a Tester to set `TESTING` from **any status** — including if the bug is still `OPEN` and hasn't been through `IN_PROGRESS → REVIEW` by a Developer. Testers can skip the entire developer workflow and mark any `OPEN` bug as `TESTING`.

**Fix:** Backend should validate that a bug must be in `REVIEW` before a Tester can move it to `TESTING`.

---

### BUG-F10 · Removing a Member Does NOT Unassign Their Bugs
**File:** [ProjectService.java](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/src/main/java/org/miniproject/BugNest/service/ProjectService.java) L193 — `memberRepository.delete(memberToRemove)`  
**Type:** Data integrity — orphaned assignments

**Problem:**  
When an Admin removes a member from a project, all bugs that were assigned to that user remain assigned to them — even though they're no longer in the project. The bugs table still shows their name as assignee, and the removed user can still see those bugs (since [getAccessibleBug()](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/src/main/java/org/miniproject/BugNest/service/BugService.java#311-333) checks membership but the user is no longer a member, so they'd actually get "Access Denied" on the bug detail).

This creates ghost assignments: bugs perpetually stuck with an ex-member's name, with no way to access them from the bug detail page (throws access denied) but still visible in the bug list with the old name.

**Fix:** In [removeMember()](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/src/main/java/org/miniproject/BugNest/controller/ProjectController.java#83-93), also call `bugRepository.findByProjectAndAssignee(project, removedUser)` and set `assignee = null` for all those bugs.

---

## 🟡 MEDIUM — Noticeable but Workaroundable

---

### BUG-F11 · [createProject()](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/src/main/java/org/miniproject/BugNest/service/ProjectService.java#27-55) Adds Creator as `PROJECT_MANAGER` Role Regardless of Their System Role
**File:** [ProjectService.java](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/src/main/java/org/miniproject/BugNest/service/ProjectService.java) L47  
**Type:** Business logic inconsistency

```java
member.setRole(Role.PROJECT_MANAGER);
```
If a `DEVELOPER` user creates a project (which is allowed since there's no role check on `POST /api/projects`), they become listed as `PROJECT_MANAGER` of that project — but their system role is still `DEVELOPER`. This creates a split identity: they're a dev system-wide but a PM for one project.

---

### BUG-F12 · [getAvailableUsers()](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/src/main/java/org/miniproject/BugNest/controller/ProjectController.java#94-98) Loads ALL Users Into Memory to Filter
**File:** [ProjectService.java](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/src/main/java/org/miniproject/BugNest/service/ProjectService.java) L201  
**Type:** Performance / scalability bug

```java
List<User> usersByRole = userRepository.findAll().stream()
        .filter(u -> u.getRole() == role)
        .collect(Collectors.toList());
```
With 10,000+ users, this loads every user into memory just to filter by role. Should use a direct DB query: `userRepository.findByRole(role)`.

---

### BUG-F13 · Dashboard Stats "Open Bugs" Counts IN_PROGRESS, REVIEW, TESTING as "Open"
**File:** [StatsService.java](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/src/main/java/org/miniproject/BugNest/service/StatsService.java) L30  
**Type:** Misleading metric

```java
openBugs = bugRepository.countByStatusNot(BugStatus.CLOSED);
```
"Open Bugs" on the dashboard actually means "all non-closed bugs" — including `IN_PROGRESS`, `REVIEW`, and `TESTING`. A bug that's being fixed and almost done is still counted as "open". This makes the dashboard misleading — it looks like there are many unstarted bugs.

**Fix:** Count only `BugStatus.OPEN` for "Open Bugs", and add separate counters for "In Progress" and "In Review".

---

### BUG-F14 · [respondToInvite()](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/src/main/java/org/miniproject/BugNest/controller/ProjectController.java#71-82) Does Not Validate That Invite Is Still PENDING
**File:** [ProjectService.java](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/src/main/java/org/miniproject/BugNest/service/ProjectService.java) L224–246  
**Type:** State management bug

If a user somehow double-clicks "Accept" or has two browser tabs open and accepts the same invite twice, the second call finds the member already in `ACCEPTED` state but proceeds to call `memberRepository.save(member)` again with no guard. No error is returned — the UI looks like it worked both times.

**Fix:** Add a check: `if (member.getStatus() != ProjectMemberStatus.PENDING) throw new RuntimeException("Invite already responded to");`

---

### BUG-F15 · [updateBug()](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/src/main/java/org/miniproject/BugNest/controller/BugController.java#115-125) Always Clears Assignee If `assigneeId` Is Not Passed
**File:** [BugService.java](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/src/main/java/org/miniproject/BugNest/service/BugService.java) L264–267  
**Type:** Unintentional data loss

```java
} else {
    // Allow unassigning if ID is null or 0
    bug.setAssignee(null);
}
```
If the edit form sends `assigneeId: null` (because the PM only wanted to edit the title), it will **unassign** the bug from whoever was assigned. The `else` branch has no way to distinguish "I want to unassign" from "I didn't touch the assignee field at all".

**Fix:** Use a sentinel value (e.g., `-1` = unassign, `null` = don't change) or handle this with a separate `PATCH` endpoint.

---

## 🟢 LOW — Minor Functionality Issues

---

### BUG-F16 · [Bugs.jsx](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/frontend/src/pages/Bugs.jsx) Search on Project Selection Screen Searches by Name but Not Description
**File:** [Bugs.jsx](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/frontend/src/pages/Bugs.jsx) L135  
Only `name` and `projectKey` are searched. If you have projects "Alpha" and "Beta" and search for "mobile", nothing matches even if the project descriptions mention "mobile app". Minor but inconsistent with the bug search which searches title + bugId.

---

### BUG-F17 · No Input Validation on Bug Title or Project Name
**File:** [BugService.java](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/src/main/java/org/miniproject/BugNest/service/BugService.java) L159–165, [ProjectService.java](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/src/main/java/org/miniproject/BugNest/service/ProjectService.java) L29–40  
Any empty string, whitespace-only, or 1-character title can be saved. Backend has no `@NotBlank` / `@Size` validation on `BugCreateRequest` or `ProjectCreateRequest`. The frontend has `required` on the HTML input but this is bypassable via API calls directly.

---

### BUG-F18 · Notifications Dropdown Has No Close-on-Outside-Click Behaviour
**File:** [TopNavbar.jsx](file:///H:/CSPIT_CE/SEM-6/SGP/BugNest/frontend/src/components/TopNavbar.jsx) L100  
Once opened, the notification dropdown can only be closed by clicking the bell icon again. Clicking anywhere else on the page does not close it. Standard expected UX behaviour missing.

---

## Summary Table

| ID | File | Severity | Description |
|----|------|----------|-------------|
| F01 | BugService.java | 🔴 | Dev/Tester see no bugs — misleading empty state |
| F02 | BugService.java | 🔴 | Bug creator can't view/comment their reassigned bug |
| F03 | BugService.java | 🔴 | Race condition causes duplicate bugIds |
| F04 | UserService.java | 🔴 | Registration auto-accepts project invites silently |
| F05 | Bugs.jsx | 🔴 | Edit modal fires 2 parallel conflicting API calls |
| F06 | MyAssignedBugs.jsx | 🟠 | PM can't see bugs assigned to them |
| F07 | TopNavbar.jsx | 🟠 | User display name shows email instead of real name |
| F08 | TopNavbar.jsx | 🟠 | Invite notification doesn't show project name |
| F09 | BugDetail + BugService | 🟠 | Tester can set TESTING without going through REVIEW |
| F10 | ProjectService.java | 🟠 | Removing member leaves ghost bug assignments |
| F11 | ProjectService.java | 🟡 | Developer creating project becomes PM inconsistently |
| F12 | ProjectService.java | 🟡 | `findAll()` used instead of role-based DB query |
| F13 | StatsService.java | 🟡 | "Open bugs" count includes IN_PROGRESS/REVIEW/TESTING |
| F14 | ProjectService.java | 🟡 | No guard against double-accepting an invite |
| F15 | BugService.java | 🟡 | Unintended unassign when only title is edited |
| F16 | Bugs.jsx | 🟢 | Project search doesn't check description |
| F17 | BugService / models | 🟢 | No server-side input validation on titles |
| F18 | TopNavbar.jsx | 🟢 | Dropdown doesn't close on outside click |
