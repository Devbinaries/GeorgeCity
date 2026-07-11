from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from users.models import Driver, Farmer, Consumer
from marketplace.models import Farm, FarmProduct, Order

class OrderTrackingTestCase(APITestCase):
    def setUp(self):
        # Create users
        self.driver_user = Driver.objects.create_user(
            username='testdriver',
            email='driver@test.com',
            password='testpassword',
            first_name='John',
            last_name='Driver',
            phone_number=1234567890
        )
        self.farmer_user = Farmer.objects.create_user(
            username='testfarmer',
            email='farmer@test.com',
            password='testpassword',
            first_name='Fred',
            last_name='Farmer',
            phone_number=1234567891,
            farm_name='Happy Farms',
            farm_location='George, Central',
            farm_size=10.5,
            farm_type='Fruits'
        )
        self.consumer_user = Consumer.objects.create_user(
            username='testconsumer',
            email='consumer@test.com',
            password='testpassword',
            first_name='Chris',
            last_name='Consumer',
            phone_number=1234567892,
            address='George, Sector 5',
            category='INDIVIDUAL'
        )

        # Create Farm
        self.farm = Farm.objects.create(
            name='Happy Farms',
            location='George, Central',
            size=10.5,
            type='Fruits',
            owner=self.farmer_user
        )

        # Create Product
        self.product = FarmProduct.objects.create(
            product='Apples',
            quntity=100,
            farm=self.farm,
            category='fruits',
            description='Fresh red apples'
        )

        # Create Order
        self.order = Order.objects.create(
            product=self.product,
            quantity=10,
            ordered_by=self.consumer_user,
            produced_by=self.farm,
            deliver_to='George, Sector 5'
        )

    def test_default_coordinates_assigned(self):
        # Verify coordinates are generated automatically around George, SA
        self.assertIsNotNone(self.farm.latitude)
        self.assertIsNotNone(self.farm.longitude)
        self.assertIsNotNone(self.order.latitude)
        self.assertIsNotNone(self.order.longitude)
        
        # Verify they are in acceptable ranges (-34.02 to -33.93 for lat, 22.42 to 22.49 for lng)
        self.assertTrue(-34.1 <= float(self.farm.latitude) <= -33.8)
        self.assertTrue(22.3 <= float(self.farm.longitude) <= 22.6)

    def test_order_status_and_driver_flow(self):
        # Login as driver
        self.client.force_authenticate(user=self.driver_user)

        # 1. Accept Order
        url = reverse('marketplace:orderviewset-detail', args=[self.order.id]) + 'accept_order/'
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Reload order
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'ASSIGNED')
        self.assertEqual(self.order.driver, self.driver_user)
        self.assertEqual(float(self.order.driver_latitude), float(self.farm.latitude))
        self.assertEqual(float(self.order.driver_longitude), float(self.farm.longitude))

        # 2. Pick up Order
        url = reverse('marketplace:orderviewset-detail', args=[self.order.id]) + 'pickup_order/'
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'PICKED_UP')

        # 3. Deliver Order
        url = reverse('marketplace:orderviewset-detail', args=[self.order.id]) + 'deliver_order/'
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'DELIVERED')

    def test_only_driver_can_accept_order(self):
        # Login as consumer
        self.client.force_authenticate(user=self.consumer_user)
        
        url = reverse('marketplace:orderviewset-detail', args=[self.order.id]) + 'accept_order/'
        response = self.client.post(url)
        # Verify it fails with 400 Bad Request
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Only drivers can accept orders", response.data['error'])

    def test_order_filtering(self):
        # Authenticate
        self.client.force_authenticate(user=self.driver_user)
        
        # Test available/unassigned orders filter
        url = reverse('marketplace:orderviewset-list') + '?driver=null&status=PENDING'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        # Accept the order
        self.order.driver = self.driver_user
        self.order.status = 'ASSIGNED'
        self.order.save()

        # Test my orders filter
        url = reverse('marketplace:orderviewset-list') + '?driver=me'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        # Test unassigned orders filter should now return 0
        url = reverse('marketplace:orderviewset-list') + '?driver=null&status=PENDING'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)
