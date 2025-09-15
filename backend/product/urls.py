from django.urls import include, path
from rest_framework.routers import DefaultRouter

from product.views import (
    BulkCategoryUpdateDeleteAPIView,
    BulkMaterialUpdateDeleteAPIView,
    BulkProductUpdateDeleteAPIView,
    CategoryAPIView,
    CategoryBulkDuplicateAPIView,
    ProductAndMaterialListView,
    ProductAPIView,
    ProductImageViewSet,
    ProductMaterialBulkDuplicateAPIView,
    ProductMaterialViewset,
    ProductSeoViewSet,
    ProductVariantViewSet,
    ProductViewSet,
    SubCategoryViewSet,
    UpdateQuantityAPIView,
    BasketAPIView,
    UserBasketAPIView,
    TimeSlotConfigurationViewSet,
    GetBarcodeView,
    RelatedProductAPIView,
    HotDealProductsView,
    AddToHotDealView,
    ProductRatingAPIView,
    FavouriteItemAPIView,
    BulkBasketUpdateDeleteAPIView,
    ProductPDFExportAPIView,
    BasketProductRemoveAPIView,
    ProductOrMaterialDetailView,
    GenerateSKUAPIView,
    BasketProductAddAPIView,
    ShowProductListFromBasket,
    CloneUserBasketView
)

router = DefaultRouter()
router.register(r"product-images", ProductImageViewSet)
router.register(r"product-variants", ProductVariantViewSet)
router.register(r"product-seo", ProductSeoViewSet)
router.register(r"product-material", ProductMaterialViewset)
router.register(r"subcategories", SubCategoryViewSet)
router.register(r"timeslots", TimeSlotConfigurationViewSet)


urlpatterns = [
    path("", include(router.urls)),
    path(
        "categories/",
        CategoryAPIView.as_view(),
        name="categories",
    ),
    path("rate-product/", ProductRatingAPIView.as_view(), name="rate-product"),
    path("categories/<int:pk>/", CategoryAPIView.as_view(), name="categories"),
    path("baskets/", BasketAPIView.as_view(), name="basket-list"),
    path("baskets/<int:pk>/", BasketAPIView.as_view(), name="basket-detail"),
    path("user_basket/", UserBasketAPIView.as_view(), name="user_basket_list"),
    path(
        "user-basket/<int:basket_id>/", UserBasketAPIView.as_view(), name="user-basket"
    ),
    path('clone-user-basket/', CloneUserBasketView.as_view(), name='clone-user-basket'),
    path("rate-product/", ProductRatingAPIView.as_view(), name="rate-product"),
    path("hot-deals/", HotDealProductsView.as_view(), name="hot-deal-products"),
    path("add-hot-deal/<int:pk>/", AddToHotDealView.as_view(), name="add-hot-deal"),
    path("get-barcode/", GetBarcodeView.as_view(), name="get-barcode"),
    path(
        "bulk-basket/",
        BulkBasketUpdateDeleteAPIView.as_view(),
        name="bulk-basket-update-delete",
    ),
    path(
        "bulk-category-update/",
        BulkCategoryUpdateDeleteAPIView.as_view(),
        name="category-update",
    ),
    path(
        "inventory-list/",
        ProductAndMaterialListView.as_view(),
        name="inventory-list",
    ),
    path(
        "update-stock/",
        UpdateQuantityAPIView.as_view(),
        name="update-stock",
    ),
    path("products/", ProductViewSet.as_view(), name="products"),
    path("products/<int:pk>/", ProductAPIView.as_view(), name="product-detail"),
    path(
        "bulk-material-update/",
        BulkMaterialUpdateDeleteAPIView.as_view(),
        name="bulk-material-update",
    ),
    path(
        "bulk-product-update/",
        BulkProductUpdateDeleteAPIView.as_view(),
        name="product-update",
    ),
    path(
        "duplicate-material/",
        ProductMaterialBulkDuplicateAPIView.as_view(),
        name="duplicate-material",
    ),
    path(
        "duplicate-category/",
        CategoryBulkDuplicateAPIView.as_view(),
        name="duplicate-category",
    ),
    path("related-products/", RelatedProductAPIView.as_view(),
         name="related-product"),
    path("favourite-item/", FavouriteItemAPIView.as_view(),
         name="favourite_item"),
    path(
        "favourite-item/<int:pk>/", FavouriteItemAPIView.as_view(),
        name="update_item"
    ),
    path(
        "export-product/", ProductPDFExportAPIView.as_view(),
        name="export-product"
    ),
    path("basket/<int:basket_id>/remove-product/", 
         BasketProductRemoveAPIView.as_view(),
         name="remove-product-from-basket"),
    path("hot-deals/", HotDealProductsView.as_view(), name="hot-deal-products"),
    path("add-hot-deal/<int:pk>/", AddToHotDealView.as_view(), name="add-hot-deal"),
    path("get-barcode/", GetBarcodeView.as_view(), name="get-barcode"),
    path(
        "get-product-detail/<str:unique_code>/",
        ProductOrMaterialDetailView.as_view(),
        name="get-detail",
    ),
    path(
        "generate-sku/",
        GenerateSKUAPIView.as_view(),
        name="generate-sku",
    ),
    path("basket/<int:basket_id>/add-product/",
         BasketProductAddAPIView.as_view(),
         name="add-product-to-basket"),

    path('showproductfrombasket/', ShowProductListFromBasket, name="showproductfrombasket")

]
