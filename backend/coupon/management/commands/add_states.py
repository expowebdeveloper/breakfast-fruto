from django.core.management.base import BaseCommand

from coupon.models import State


class Command(BaseCommand):
    help = "Adds Sweden states to the State table"

    STATES = [
        {"name": "Stockholms län", "abbreviation": "Stockholm"},
        {"name": "Västernorrlands län", "abbreviation": "Västernorrland"},
        {"name": "Västra Götalands län", "abbreviation": "Västra Götaland"},
        {"name": "Östergötlands län", "abbreviation": "Östergötland"},
        {"name": "Gävleborgs län", "abbreviation": "Gävleborg"},
        {"name": "Hallands län", "abbreviation": "Halland"},
        {"name": "Jämtlands län", "abbreviation": "Jämtland"},
        {"name": "Jönköpings län", "abbreviation": "Jönköping"},
        {"name": "Kalmar län", "abbreviation": "Kalmar"},
        {"name": "Skåne län", "abbreviation": "Skåne"},
        {"name": "Södermanlands län", "abbreviation": "Södermanland"},
        {"name": "Uppsala län", "abbreviation": "Uppsala"},
        {"name": "Värmlands län", "abbreviation": "Värmland"},
        {"name": "Västerbottens län", "abbreviation": "Västerbotten"},
        {"name": "Blekinge län", "abbreviation": "Blekinge"},
        {"name": "Nordmalings län", "abbreviation": "Nordmaling"},
        {"name": "Örebro län", "abbreviation": "Örebro"},
    ]

    def handle(self, *args, **kwargs):
        for state in self.STATES:
            state_obj, created = State.objects.get_or_create(
                name=state["name"], defaults={"abbreviation": state["abbreviation"]}
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully added state: {state["name"]}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'State already exists: {state["name"]}')
                )
