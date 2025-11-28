output "ec2_public_ip" {
  description = "Public IP of EC2 instance"
  value       = aws_instance.app.public_ip
}

output "ec2_public_dns" {
  description = "Public DNS of EC2 instance"
  value       = aws_instance.app.public_dns
}

output "s3_bucket_name" {
  description = "Name of S3 bucket for videos"
  value       = aws_s3_bucket.videos.id
}

output "dynamodb_tables" {
  description = "DynamoDB table names"
  value = {
    users     = aws_dynamodb_table.users.name
    companies = aws_dynamodb_table.companies.name
    sites     = aws_dynamodb_table.sites.name
    robots    = aws_dynamodb_table.robots.name
    missions  = aws_dynamodb_table.missions.name
  }
}
