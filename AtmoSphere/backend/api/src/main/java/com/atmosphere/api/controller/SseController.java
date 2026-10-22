package com.atmosphere.api.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.atmosphere.api.messaging.SseService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class SseController {

    private final SseService sseService;

    @GetMapping({"/realtimedata", "/sse/realtimedata"})
    public SseEmitter subscribeRealTimeData() {
        return sseService.createEmitter();
    }

    @GetMapping("/sse/alerts")
    public SseEmitter subscribeAlerts() {
        return sseService.createEmitter();
    }
}
