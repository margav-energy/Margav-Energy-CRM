from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token

User = get_user_model()


class Command(BaseCommand):
    help = 'Generate authentication tokens for all users'

    def handle(self, *args, **options):
        users = User.objects.all()
        
        for user in users:
            token, created = Token.objects.get_or_create(user=user)
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Generated token for {user.username}: {token.key}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Token already exists for {user.username}: {token.key}')
                )

        self.stdout.write(
            self.style.SUCCESS('Token generation completed!')
        )
