# Dynamic Single-Page Application - Frontend

## What We Built

A dynamic, single-page application with:

1. **Universal Navigation**: Sidebar navigation that persists across all views
2. **No Page Reloads**: Clicking nav links changes content dynamically without full page reload
3. **Add Manuals Page**: Full-featured PDF upload interface with:
   - Drag & drop functionality for PDF files
   - Modern dropdown to select product type (Washing Machine, Refrigerator, AC)
   - File list with ability to remove files
   - Upload button (frontend only, backend integration pending)

## File Structure

```
frontend/src/
├── components/
│   ├── sidebar.tsx                 # Universal navigation sidebar
│   ├── dashboard-layout.tsx        # Main layout with navigation state management
│   ├── chat-view.tsx              # Chat interface (placeholder)
│   ├── add-manuals.tsx            # PDF upload interface
│   └── manage-manual.tsx          # Manual management (placeholder)
└── app/
    └── page.tsx                    # Main page entry point
```

## Features

### Navigation System
- **State Management**: Uses React useState to track active view
- **No Reloads**: Content switches without page refresh
- **Active States**: Visual feedback for current page
- **Smooth Transitions**: Animated content changes

### Add Manuals Page
- **Drag & Drop**: 
  - Drag PDF files over the drop zone
  - Visual feedback when dragging
  - Accepts multiple files
  
- **File Browser**: Click "Browse Files" button to select PDFs

- **Product Selector**: 
  - Dropdown with three options
  - Custom styled select element
  - Required before upload

- **File Management**:
  - Shows file name and size
  - Remove individual files
  - Upload button activates when product selected and files added

## How It Works

1. **DashboardLayout** component manages navigation state
2. **Sidebar** component accepts `activeView` and `onNavigate` props
3. Clicking nav items calls `onNavigate` with the view name
4. Layout renders appropriate component based on `activeView`
5. No route changes = no page reloads

## Next Steps

- Connect Add Manuals upload to backend API
- Implement Chat interface
- Build Manual management pages
- Add loading states and error handling
- Implement file validation and progress tracking
