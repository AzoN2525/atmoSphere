package com.atmosphere.api.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.atmosphere.api.messaging.SseService;

import lombok.RequiredArgsConstructor;

/**
 * Simple health endpoint used by docker-compose healthcheck.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class Health {

	private final SseService sseService;

	@GetMapping("/health")
	public ResponseEntity<Map<String, Object>> health() {
		return ResponseEntity.ok(Map.of(
				"status", "UP",
				"activeSseEmitters", sseService.getActiveEmitterCount()
		));
	}

}