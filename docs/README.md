# Documentation Assets

This folder contains all visual assets and diagrams used in the project documentation.

## Image Files

### Architecture Diagrams

| Filename | Description | Used In |
|----------|-------------|---------|
| `architecture-ingestion-pipeline.png` | Document ingestion flow showing PDF upload, parsing, embedding, and storage in ChromaDB | README.md, VISUAL_GUIDE.md |
| `architecture-chat-system.png` | Complete chat system architecture from user query to AI response with database persistence | README.md, VISUAL_GUIDE.md |
| `architecture-agent-orchestration.png` | Hierarchical multi-agent system showing supervisor coordination and parallel expert execution | README.md, VISUAL_GUIDE.md |
| `database-schema-diagram.png` | PostgreSQL database schema showing chat_sessions and chat_messages tables with relationships | README.md, VISUAL_GUIDE.md |

### User Interface Screenshots

| Filename | Description | Used In |
|----------|-------------|---------|
| `ui-main-chat-interface.png` | Main application interface with sidebar, chat history, and message input | README.md, VISUAL_GUIDE.md |
| `ui-multi-agent-demo.png` | Multi-agent system in action with "Running Agent Agent" status indicator | README.md, VISUAL_GUIDE.md |
| `ui-agent-response-example.png` | Detailed agent responses showing washing machine and AC expert answers with timing | README.md, VISUAL_GUIDE.md |
| `manual-upload-interface.png` | PDF manual upload interface for document ingestion | README.md, VISUAL_GUIDE.md |

## File Naming Convention

All image files follow a consistent naming pattern:

- **Architecture Diagrams**: `architecture-[component-name].png`
  - Example: `architecture-ingestion-pipeline.png`
  
- **User Interface Screenshots**: `ui-[screen-name].png`
  - Example: `ui-main-chat-interface.png`

- **Database Diagrams**: `database-[diagram-type].png`
  - Example: `database-schema-diagram.png`

- **Feature-Specific**: `[feature-name]-[description].png`
  - Example: `manual-upload-interface.png`

## Usage Guidelines

### Markdown Reference

To reference these images in markdown documents:

```markdown
![Alt Text](docs/filename.png)
```

### Examples

**Architecture Diagram:**
```markdown
![Ingestion Pipeline](docs/architecture-ingestion-pipeline.png)
```

**UI Screenshot:**
```markdown
![Main Interface](docs/ui-main-chat-interface.png)
```

**Database Schema:**
```markdown
![Database Schema](docs/database-schema-diagram.png)
```

## Image Specifications

- **Format**: PNG (Portable Network Graphics)
- **Color Mode**: RGB with transparency support
- **Recommended DPI**: 72-144 for web display
- **Size Range**: 10KB - 500KB per image

## Related Documentation

- [Main README](../README.md) - Project overview and setup instructions
- [Visual Guide](../VISUAL_GUIDE.md) - Comprehensive visual walkthrough
- [Docker Guide](../DOCKER_GUIDE.md) - Docker and PostgreSQL setup

## Maintenance

When adding new images:

1. Follow the naming convention above
2. Optimize images for web (use PNG compression)
3. Update this README with the new file information
4. Reference the image in relevant documentation files
5. Add descriptive alt text for accessibility

## Version History

### October 22, 2025
- Renamed all screenshot files to descriptive names
- Established consistent naming convention
- Updated all references in documentation files
- Created this README for the docs folder

---

**Note**: All images are used for documentation purposes and showcase the Multi-Agent RAG Pipeline system architecture and user interface.
