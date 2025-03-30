import pika
import json

def send_to_rabbitmq(message):
    connection = pika.BlockingConnection(pika.ConnectionParameters(host='localhost'))
    channel = connection.channel()
    channel.queue_declare(queue='stock_updates')
    channel.basic_publish(exchange='', routing_key='stock_updates', body=json.dumps(message))
    connection.close()