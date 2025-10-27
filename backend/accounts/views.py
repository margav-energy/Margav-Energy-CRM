from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password
from .models import User
from .serializers import UserSerializer, UserCreateSerializer, LoginSerializer
from .permissions import IsAdminOrReadOnly, IsOwnerOrAdmin


class UserListCreateView(generics.ListCreateAPIView):
    """
    List all users or create a new user (admin only for creation).
    """
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserSerializer


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a user.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]


@api_view(['POST'])
@permission_classes([])
def obtain_auth_token(request):
    """
    Obtain authentication token for user login.
    """
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """
    Get current authenticated user details.
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verify_auth_token(request):
    """
    Verify that the authentication token is still valid.
    This endpoint is used when the client comes back online after offline mode.
    
    Returns user data if token is valid, 401 if invalid.
    """
    # If we reach here, the token is valid (IsAuthenticated middleware passed)
    serializer = UserSerializer(request.user)
    return Response({
        'valid': True,
        'user': serializer.data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def refresh_auth_token(request):
    """
    Refresh the authentication token.
    Creates a new token and returns it along with user data.
    The old token becomes invalid.
    """
    # Delete old token
    old_token = Token.objects.get(user=request.user)
    old_token.delete()
    
    # Create new token
    new_token = Token.objects.create(user=request.user)
    
    serializer = UserSerializer(request.user)
    return Response({
        'token': new_token.key,
        'user': serializer.data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Change user password.
    """
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')

    if not old_password or not new_password:
        return Response({
            'error': 'Both old_password and new_password are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Verify old password
    if not check_password(old_password, request.user.password):
        return Response({
            'error': 'Current password is incorrect'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Validate new password length
    if len(new_password) < 3:
        return Response({
            'error': 'New password must be at least 3 characters long'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Set new password
    request.user.set_password(new_password)
    request.user.save()

    return Response({
        'message': 'Password changed successfully'
    })


@api_view(['POST'])
@permission_classes([])
def change_password_for_user(request):
    """
    Change password for a specific user by username (no authentication required).
    """
    username = request.data.get('username')
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')

    if not username or not old_password or not new_password:
        return Response({
            'error': 'Username, old_password and new_password are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({
            'error': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)

    # Verify old password
    if not check_password(old_password, user.password):
        return Response({
            'error': 'Current password is incorrect'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Validate new password length
    if len(new_password) < 3:
        return Response({
            'error': 'New password must be at least 3 characters long'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Set new password
    user.set_password(new_password)
    user.save()

    return Response({
        'message': 'Password changed successfully'
    })
