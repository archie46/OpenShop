# OpenShop - Enterprise Microservices E-commerce Platform

![OpenShop Banner](assets/Readme%20file%20banner.jpg)

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-17+-orange.svg)](https://www.oracle.com/java/)
[![React](https://img.shields.io/badge/React-19.x-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)
[![Kafka](https://img.shields.io/badge/Kafka-7.5-black.svg)](https://kafka.apache.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

OpenShop is a modern, microservices-based e-commerce platform demonstrating enterprise-grade architecture patterns. Built with Spring Boot microservices backend and React frontend, it provides a complete e-commerce solution with distributed transaction management, event-driven communication, and RESTful/GraphQL APIs.

## 📑 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🏗️ Architecture Overview

OpenShop implements a sophisticated microservices architecture with event-driven communication:

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  React Frontend (Vite)                       │
│                    http://localhost:5173                     │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway (Port 8080)                    │
│         Spring Cloud Gateway + JWT Authentication            │
│  - Routes requests to services                               │
│  - Validates JWT tokens                                      │
│  - Propagates user context (X-User-Id, X-User-Role)         │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│    User     │   │   Product   │   │    Cart     │
│  Service    │   │   Service   │   │  Service    │
│  (8081)     │   │  (8082)     │   │  (8085)     │
│             │   │             │   │             │
│ PostgreSQL  │   │ PostgreSQL  │   │ PostgreSQL  │
│   (5432)    │   │   (5433)    │   │   (5435)    │
└─────────────┘   └──────┬──────┘   └─────────────┘
                         │ GraphQL
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│    Order    │   │  Inventory  │   │   Payment   │
│  Service    │   │  Service    │   │  Service    │
│  (8083)     │   │  (8086)     │   │  (8084)     │
│             │   │             │   │             │
│ PostgreSQL  │   │ PostgreSQL  │   │ PostgreSQL  │
│   (5434)    │   │   (5436)    │   │   (5437)    │
└──────┬──────┘   └──────┬──────┘   └──────┬──────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │ Kafka Events (Saga Pattern)
                         ▼
┌──────────────────────────────────────────────────────────────┐
│           Apache Kafka (Port 9092) + Zookeeper               │
│  Topics:                                                      │
│  - order.payment.request / payment.order.response            │
│  - order.inventory.reserve.request / response                │
│  - order.shipping.request / shipping.order.response          │
│  - payment.refund.request / inventory.release.request        │
└─────────────────────────┬────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                                   ▼
┌─────────────┐                    ┌─────────────┐
│Notification │                    │  Shipping   │
│  Service    │                    │  Service    │
│  (8087)     │                    │  (8088)     │
│             │                    │             │
│ PostgreSQL  │                    │ PostgreSQL  │
│   (5438)    │                    │   (5439)    │
└─────────────┘                    └─────────────┘
```

### Core Components

| Component | Port | Database | Technology | Purpose |
|-----------|------|----------|------------|---------|
| **Frontend** | 5173 | - | React 19 + TypeScript + Vite | User interface |
| **API Gateway** | 8080 | - | Spring Cloud Gateway | Request routing, JWT validation |
| **User Service** | 8081 | PostgreSQL:5432 | Spring Boot | Authentication & user management |
| **Product Service** | 8082 | PostgreSQL:5433 | Spring Boot + GraphQL | Product catalog with GraphQL API |
| **Order Service** | 8083 | PostgreSQL:5434 | Spring Boot + Kafka | Order management with Saga pattern |
| **Payment Service** | 8084 | PostgreSQL:5437 | Spring Boot + Kafka | Payment processing |
| **Cart Service** | 8085 | PostgreSQL:5435 | Spring Boot | Shopping cart management |
| **Inventory Service** | 8086 | PostgreSQL:5436 | Spring Boot + Kafka | Stock management |
| **Notification Service** | 8087 | PostgreSQL:5438 | Spring Boot | Multi-channel notifications |
| **Shipping Service** | 8088 | PostgreSQL:5439 | Spring Boot + Kafka | Shipment tracking |
| **Kafka** | 9092 | - | Apache Kafka 7.5 | Event streaming platform |
| **Zookeeper** | 2181 | - | Apache Zookeeper | Kafka coordination |

---

## ✨ Key Features

### 🎯 Business Features
- **User Management**: Registration, authentication, and profile management
- **Product Catalog**: Full CRUD with GraphQL query support
- **Shopping Cart**: Add, remove, update quantities, checkout
- **Order Processing**: Complete order workflow with distributed transactions
- **Inventory Management**: Real-time stock tracking and reservation
- **Payment Integration**: Idempotent payment processing
- **Shipping Tracking**: Order fulfillment and delivery tracking
- **Notifications**: Multi-channel notification system

### 🔧 Technical Features

- **Microservices Architecture**: Independent, scalable services
- **Event-Driven Communication**: Kafka-based messaging for loose coupling
- **Saga Pattern**: Distributed transaction management with compensation
- **GraphQL API**: Flexible product queries with nested field selection
- **JWT Authentication**: Stateless, secure authentication
- **API Gateway Pattern**: Single entry point with routing and filtering
- **Database per Service**: Isolated data stores (PostgreSQL)
- **Docker Support**: Containerized deployment with Docker Compose
- **Health Monitoring**: Actuator endpoints for all services
- **Modern Frontend**: React 19 with TypeScript, Material-UI, Redux Toolkit

### 📊 Design Patterns
- **Saga Pattern**: Choreography-based distributed transactions via Kafka
- **API Gateway Pattern**: Centralized routing and authentication
- **Database per Service**: Microservices data isolation
- **Event Sourcing**: Event-driven architecture with Kafka
- **CQRS**: Separation of command and query responsibilities (GraphQL for reads)

---

## 🛠️ Technology Stack

### Backend
- **Framework**: Spring Boot 3.x
- **Language**: Java 17+
- **API**: REST + GraphQL (via Spring GraphQL)
- **Message Broker**: Apache Kafka 7.5 + Zookeeper
- **Database**: PostgreSQL 15
- **Gateway**: Spring Cloud Gateway
- **Security**: Spring Security + JWT
- **Build Tool**: Maven 3.8+

### Frontend
- **Framework**: React 19.2
- **Language**: TypeScript 5.9
- **Build Tool**: Vite 7.2
- **UI Library**: Material-UI (MUI) 7.3
- **State Management**: Redux Toolkit 2.10 + Zustand 5.0
- **Routing**: React Router 7.9
- **Styling**: Tailwind CSS 4.1 + Emotion
- **Form Handling**: React Hook Form 7.66 + Zod validation
- **HTTP Client**: Axios 1.13

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes (optional)
- **Databases**: 8 PostgreSQL instances (one per service)
- **Message Queue**: Kafka + Zookeeper

---

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed:
- **Java 17+** - [Download](https://adoptium.net/)
- **Maven 3.8+** - [Download](https://maven.apache.org/download.cgi)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop)
- **Git** - [Download](https://git-scm.com/downloads)

### Installation

1. **Clone the Repository**
```bash
git clone https://github.com/yourusername/OpenShop.git
cd OpenShop
```

2. **Start Infrastructure Services**
```bash
cd services
./start-databases.sh
```
This starts PostgreSQL databases, Kafka, and Zookeeper in Docker containers.

3. **Build Backend Services**
```bash
./build-all.sh
```

4. **Start Backend Services**
```bash
./start-local.sh
```
This will start all microservices on their respective ports.

5. **Start Frontend**
```bash
cd ../ui
npm install
npm run dev
```
Frontend will be available at http://localhost:5173

6. **Access the Application**
- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:8080
- **API Documentation**: See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed API reference

### Verify Installation

```bash
# Check all services are healthy
curl http://localhost:8080/actuator/health  # API Gateway
curl http://localhost:8081/actuator/health  # User Service
curl http://localhost:8082/actuator/health  # Product Service
# ... check other services

# Check Kafka
docker exec kafka kafka-topics --list --bootstrap-server localhost:9092
```

---

## 📁 Project Structure

```
OpenShop/
├── services/                      # Backend microservices
│   ├── apigateway/                # API Gateway (8080)
│   ├── userservice/               # User Service (8081)
│   ├── productservice/            # Product Service with GraphQL (8082)
│   ├── orderservice/              # Order Service with Saga (8083)
│   ├── paymentservice/            # Payment Service (8084)
│   ├── cartservice/               # Cart Service (8085)
│   ├── inventoryservice/          # Inventory Service (8086)
│   ├── shippingservice/           # Shipping Service (8088)
│   ├── common-events/             # Shared Kafka event classes
│   ├── docker-compose.yml         # Docker services definition
│   ├── build-all.sh               # Build all services script
│   ├── start-local.sh             # Start services locally
│   ├── start-databases.sh         # Start databases and Kafka
│   ├── stop-all.sh                # Stop all services
│   └── stop-databases.sh          # Stop databases and Kafka
├── ui/                            # React frontend
│   ├── src/
│   │   ├── api/                   # API client
│   │   ├── components/            # React components
│   │   ├── pages/                 # Page components
│   │   ├── stores/                # Redux & Zustand stores
│   │   └── main.tsx               # Entry point
│   ├── package.json               # npm dependencies
│   └── vite.config.ts             # Vite configuration
├── assets/                        # Images and assets
├── CONTRIBUTING.md                # Development guide
├── README.md                      # This file
└── LICENSE                        # MIT License
```

---

## 📚 Documentation

For detailed documentation, please refer to:

- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Complete development guide including:
  - Prerequisites and installation
  - Service documentation
  - API reference with examples
  - Development workflows
  - Database management
  - Testing strategies
  - Deployment options
  - Troubleshooting

- **Service-Specific READMEs** (in each service directory)

---

## 🎯 Getting Started with Development

### Running Individual Services

```bash
# Start only databases
cd services
./start-databases.sh

# Run specific service
cd userservice
mvn spring-boot:rungit add 
```

### Frontend Development

```bash
cd ui
npm run dev      # Development server with hot reload
npm run build    # Production build
npm run preview  # Preview production build
```

### Docker Deployment

```bash
cd services
docker-compose up -d    # Start all services
docker-compose down     # Stop all services
docker-compose logs -f  # View logs
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on:

- Code style and conventions
- Development workflow
- Testing requirements
- Pull request process
- Issue reporting

---

## 🔒 Security

- **JWT Authentication**: Stateless token-based authentication
- **Role-Based Access Control**: Customer, Seller, and Admin roles
- **Secure Password Storage**: BCrypt password hashing
- **CORS Configuration**: Configured for production use
- **Environment Variables**: Sensitive data via environment configuration

**Note**: This project is for educational/demonstration purposes. For production use, implement additional security measures.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Spring Boot** - Microservices framework
- **React** - Frontend library
- **Apache Kafka** - Event streaming platform
- **PostgreSQL** - Database system
- **Material-UI** - React UI framework
- **Docker** - Containerization platform

---

## 📞 Support

- **Documentation**: See [CONTRIBUTING.md](CONTRIBUTING.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/OpenShop/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/OpenShop/discussions)

---

**Built with ❤️ using Spring Boot, React, and modern microservices patterns**

**Version**: 1.0.0  
**Last Updated**: November 2025
