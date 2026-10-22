package com.atmosphere.api.service;


//O servico que implementar essa interface  vai ser responsavel para gerar dados
// de Areas (ele recebe os dados lidos do rabbitmq e cria os dados para um conjunto de
// areas previamente Definidos , (Essa geracao tem de ser aleatoria )
// )

public interface AreaDataGeneration {
    public void processData(String queue ,String message);

}
