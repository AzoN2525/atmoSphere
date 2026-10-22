# Hot Reload Setup para Spring Boot

## 📝 O que foi configurado?

O hot reload permite que o Spring Boot reinicie automaticamente quando há mudanças no código, sem perder o estado da aplicação.

## ✅ Configurações Implementadas

### 1. **Spring DevTools** (pom.xml)
- Dependência já estava presente
- Responsável pelo mecanismo de restart automático

### 2. **application.properties**
```properties
spring.devtools.restart.enabled=true
spring.devtools.restart.additional-paths=src/main/java
spring.devtools.livereload.enabled=true
```

### 3. **dockerfile.dev (Backend)**
- Alterado para usar `mvn spring-boot:run` em vez de compilar para JAR
- Permite que Maven recompile o código automaticamente

### 4. **docker-compose.dev.yml**
Volumes montados para o serviço API:
```yaml
volumes:
  - ../backend/api/src:/app/src:cached        # Code
  - ../backend/api/pom.xml:/app/pom.xml:ro    # Dependencies
  - maven_cache:/root/.m2                      # Maven cache
```

## 🚀 Como usar

1. **Inicie os serviços:**
   ```bash
   cd AtmoSphere/development
   docker-compose -f docker-compose.dev.yml up
   ```

2. **Faça alterações no código** em `src/main/java`

3. **Salve o arquivo** e o Spring Boot:
   - ✨ Recompilará as classes
   - 🔄 Reiniciará automaticamente
   - 💾 Manterá o estado quando possível

## 📊 Tempo de Restart

- **Primeira inicialização**: ~30-40 segundos (download de dependências)
- **Restarts subsequentes**: ~5-10 segundos (cache do Maven)

## ⚙️ Dicas

- O volume `maven_cache` evita re-download de dependências
- Use o flag `:cached` para melhor performance em Mac/Windows
- Para forçar reload completo, use `Ctrl+C` e reinicie

## 🔍 Verificação

Quando o servidor reinicia com sucesso, você verá no logs:
```
Spring DevTools (v3.x.x) is running!
Application startup complete
```

## ⚠️ Limitações

- Mudanças em `application.properties` requerem restart completo
- Mudanças em dependências requerem rebuild do Docker
- Algumas anotações do Spring podem não fazer reload automático

---

**Última atualização**: 20 de abril de 2026
