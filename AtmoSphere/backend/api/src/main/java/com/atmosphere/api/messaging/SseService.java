package com.atmosphere.api.messaging;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class SseService {

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter createEmitter() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.add(emitter);

        emitter.onCompletion(() -> removeEmitter(emitter));
        emitter.onTimeout(() -> removeEmitter(emitter));
        emitter.onError(error -> removeEmitter(emitter));

        log.info("Novo cliente SSE ligado. Total: {}", emitters.size());
        return emitter;
    }

    public void sendMessage(String eventName, Object data) {
        List<SseEmitter> deadEmitters = new ArrayList<>();

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(
                        SseEmitter.event()
                                .name(eventName)
                                .data(data, MediaType.APPLICATION_JSON));
            } catch (IOException | IllegalStateException ex) {
                deadEmitters.add(emitter);
                log.warn("Cliente SSE removido: {}", ex.getMessage());
            }
        }

        emitters.removeAll(deadEmitters);
    }

    public int getActiveEmitterCount() {
        return emitters.size();
    }

    private void removeEmitter(SseEmitter emitter) {
        emitters.remove(emitter);
    }
}
