const { Kafka } = require('kafkajs');

async function start() {
  const kafka = new Kafka({
    clientId: 'task-consumer',
    brokers: ['kafka:9092']
  });

  const consumer = kafka.consumer({ groupId: 'task-consumer-group' });

  await consumer.connect();
  console.log("🟢 Kafka Consumer connected");

  await consumer.subscribe({ topic: 'task-events', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const key = message.key.toString();
      const value = message.value.toString();

      console.log("\n📥 Kafka NEW EVENT:");
      console.log("Topic:", topic);
      console.log("Key:", key);
      console.log("Payload:", value);
    },
  });
}

start();
