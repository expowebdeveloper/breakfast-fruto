from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from account.permissions import IsAdmin
from .models import WelcomePopup
from .serializers import WelcomePopupSerializer
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.exceptions import ValidationError


from rest_framework.decorators import api_view

class CreateWelcomePopupAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        try:
            ser = WelcomePopupSerializer(data = request.data)
            if ser.is_valid():
                ser.save()
                print("Welcome Popup Created")
                return Response({'data': "Popup Created Successfully"}, status=200)
            print("Error: ", ser.errors)
            return Response({'data': "Error Creating Popup"}, status=500)
        except:
            return Response({'Error': "You can only add one Pop Up Message"}, status=500)

    

    def get(self, request):
        try:
            data = WelcomePopup.objects.first()
            print("Welcome Popup: ", data)
            ser = WelcomePopupSerializer(data, many=False)
            return Response({'data': ser.data}, status=200)
        except Exception as e:
            print("Error: ", e)
            return Response({'Error': f"{e}"}, status=500)

    def put(self, request):
        popup = WelcomePopup.objects.first()
        serializer = WelcomePopupSerializer(instance=popup, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'status': "Updated Successfully"}, status=status.HTTP_200_OK)
        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        
    def delete(self, request):
        data = WelcomePopup.objects.first()
        data.delete()
        return Response({'status': "Deleted Successfully"}, status=200)
        

    

@api_view(['GET'])
def FirstWelcomPopupView(request):
    try:
        data = WelcomePopup.objects.first()
        ser = WelcomePopupSerializer(data, many=False)
        return Response({'data': ser.data}, status=200)
    except Exception as e:
        return Response({'Error': f"{e}"}, status=500)
        