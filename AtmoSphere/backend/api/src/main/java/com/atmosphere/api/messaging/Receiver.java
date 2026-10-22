package com.atmosphere.api.messaging;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.CountDownLatch;

import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.atmosphere.api.messaging.config.RabbitMQConfig;
import com.atmosphere.api.service.impl.AreaDataGenerationIMP;

@Component
public class Receiver {


    @Autowired
    AreaDataGenerationIMP areaDataGenerationIMP;



    private CountDownLatch latch = new CountDownLatch(1);

    @RabbitListener(queues = {
            RabbitMQConfig.NoiseQueue,
            RabbitMQConfig.AirQueue,
            RabbitMQConfig.TrafficQueue,
    })
    public void receiveMessage(Message message) {
        String payload = new String(message.getBody(), StandardCharsets.UTF_8);
        String queue = message.getMessageProperties().getConsumerQueue();
        areaDataGenerationIMP.processData(queue,payload);
        latch.countDown();
    }

    public CountDownLatch getLatch() {
        return latch;
    }

}