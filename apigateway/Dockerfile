# API Gateway Docker Image
# Image name: api-gateway:latest
# Build command: docker build -t api-gateway:latest .

FROM sapmachine:17

WORKDIR /app

# Copy the jar file
COPY target/*.jar app.jar

# Expose the port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
