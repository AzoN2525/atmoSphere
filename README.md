# AtmoSphere

## Project Abstract

AtmoSphere is a multi-layer smart city platform designed to ingest, process, and visualize environmental sensor data, including air quality, traffic density, and noise levels.

The system integrates distributed data sources using a message-oriented middleware, stores data in a persistent database, performs real-time processing and aggregation, and exposes a REST API consumed by a web portal for visualization and analysis.

The platform supports urban planning and sustainability decision-making by providing real-time dashboards and historical trend analysis.

---

## Project Team

| Name               | Role         |
|--------------------|-------------|
| Diogo Oliveira     | Team Manager |
| Guilherme Mesquita | Product Owner |
| Bruno Charão       | Architect |
| Airton Moreira     | DevOps Master |
| All                | Developers |

---

## Architecture Overview

### High-Level Architecture

- **Data Sources**: Simulated environmental sensors (air, noise, traffic)  
- **Message Broker**: RabbitMQ
- **Backend**:
  - REST API (Spring Boot)
  - Processing & Business Logic
  - Data Persistence Layer
- **Database**: PostgreSQL
- **Frontend**: Web dashboard (React (Vite))
- **Deployment**: Docker-based multi-container setup

---

## Core Features

- Real-time environmental monitoring
- Historical data analysis
- Alert detection (threshold-based)
- Web-based dashboard visualization

---

## Project Bookmarks

- GitHub Project Board:
- Project Specification Report:
- API Documentation (Swagger):
- Deployment URL:
- Docker Compose Instructions:

---

## Repository Structure

<img width="553" height="273" alt="image" src="https://github.com/user-attachments/assets/4cb1fe0c-e03f-405b-a611-4d66071d8014" />
