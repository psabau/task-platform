const amqp = require('amqplib');

async function connectToRabbit() {
  const RABBIT_URL = 'amqp://rabbitmq';
  const QUEUE = 'email_queue';

  while (true) {
    try {
      console.log("⏳ Email Worker: Trying to connect to RabbitMQ...");

      const connection = await amqp.connect(RABBIT_URL);
      const channel = await connection.createChannel();

      await channel.assertQueue(QUEUE);

      console.log("📬 Email Worker connected! Waiting for messages...");

      channel.consume(QUEUE, msg => {
        if (msg) {
          const emailData = JSON.parse(msg.content.toString());
          
          console.log("\n📧 EMAIL JOB RECEIVED:");
          console.log("To:", emailData.to);
          console.log("Subject:", emailData.subject);
          console.log("Message:", emailData.message);

          console.log("✉️ Email sent!");

          channel.ack(msg);
        }
      });

      // break out of retry loop on success
      break;

    } catch (err) {
      console.error("❌ Failed to connect. Retrying in 3 seconds...");
      await new Promise(res => setTimeout(res, 3000));
    }
  }
}

connectToRabbit();
