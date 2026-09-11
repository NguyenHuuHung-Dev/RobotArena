# Stage 1: Build & Publish
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project definition files for layer caching
COPY RobotArena.slnx ./
COPY backend/RobotArena.Domain/*.csproj ./backend/RobotArena.Domain/
COPY backend/RobotArena.Application/*.csproj ./backend/RobotArena.Application/
COPY backend/RobotArena.Infrastructure/*.csproj ./backend/RobotArena.Infrastructure/
COPY backend/RobotArena.API/*.csproj ./backend/RobotArena.API/

RUN dotnet restore backend/RobotArena.API/RobotArena.API.csproj

# Copy remaining source code and publish
COPY backend/ ./backend/
WORKDIR /src/backend/RobotArena.API
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:5200
EXPOSE 5200

ENTRYPOINT ["dotnet", "RobotArena.API.dll"]
