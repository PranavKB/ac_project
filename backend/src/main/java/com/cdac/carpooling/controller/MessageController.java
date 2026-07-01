package com.cdac.carpooling.controller;

import com.cdac.carpooling.model.Message;
import com.cdac.carpooling.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping
    public ResponseEntity<Message> sendMessage(@RequestBody Message message) {

        message.setTimestamp(Instant.now());

        Message saved = messageRepository.save(message);

        messagingTemplate.convertAndSend(
                "/topic/chat/" + saved.getRideId(),
                saved);

        return ResponseEntity.ok(saved);
    }

    @GetMapping("/ride/{rideId}")
    public ResponseEntity<List<Message>> getRideMessages(@PathVariable String rideId) {
        return ResponseEntity.ok(messageRepository.findByRideIdOrderByTimestampAsc(rideId));

    }
}


