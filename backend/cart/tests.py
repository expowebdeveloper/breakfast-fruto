from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from account.models import CustomUser as User
from cart.models import Cart, CartItem
from product.models import ProductVariant


class CartAPITestCase(APITestCase):
    fixtures = ["cart/fixtures/cart_data.json"]

    def setUp(self):
        self.user = User.objects.create_user(
            email="testuser1@gmail.com", password="testpassword"
        )
        self.client.login(email="testuser1@gmail.com", password="testpassword")

        self.cart, created = Cart.objects.get_or_create(user=self.user)

    def test_create_cart_for_unauthenticated_user(self):
        self.client.logout()
        url = reverse("cart-create")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("session_id", response.data)

    def test_get_cart_for_authenticated_user(self):
        url = reverse("cart-create")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("id", response.data)
        self.assertIn("cart_items", response.data)
        self.assertIn("total_price", response.data)

    def test_get_cart_for_unauthenticated_user(self):
        self.client.logout()
        url = reverse("cart-create")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("id", response.data)
        self.assertIn("cart_items", response.data)
        self.assertIn("total_price", response.data)


class CartItemAPITestCase(APITestCase):
    fixtures = ["cart/fixtures/cart_data.json"]

    def setUp(self):
        self.user = User.objects.create_user(
            email="testuser1@gmail.com", password="testpassword"
        )
        self.client.login(email="testuser1@gmail.com", password="testpassword")

        self.product_variant = ProductVariant.objects.get(id=1)
        self.cart = Cart.objects.get(id=1)
        self.cart_item = CartItem.objects.create(
            cart=self.cart, product_variant=self.product_variant, quantity=1
        )

    def test_add_cart_item(self):
        url = reverse("cart-item-create")
        response = self.client.post(
            url, {"product_variant": self.product_variant.id, "quantity": 2}
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["quantity"], 4)

    def test_update_cart_item(self):
        url = reverse("cart-item", args=[self.cart_item.id])
        response = self.client.put(url, {"quantity": 5})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["quantity"], 5)

    def test_delete_cart_item(self):
        url = reverse("cart-item", args=[self.cart_item.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(CartItem.objects.count(), 1)

    def test_get_cart_items(self):
        url = reverse("cart-item-create")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)
