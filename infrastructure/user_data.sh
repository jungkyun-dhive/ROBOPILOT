#!/bin/bash

# Update system
yum update -y

# Install Docker
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Git
yum install -y git

# Clone repository (update with your repo URL)
# git clone https://github.com/jungkyun-dhive/ROBOPILOT.git /home/ec2-user/ROBOPILOT
# cd /home/ec2-user/ROBOPILOT
# docker-compose up -d

echo "EC2 setup completed"
