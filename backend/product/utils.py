from django.db import transaction
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from django.http import HttpResponse
from product.models import Product, ProductImage, Basket
from reportlab.lib import colors
from datetime import datetime


MAX_LINES_PER_PAGE = 40


def update_feature_image(product_id, feature_image):
    try:
        product = Product.objects.get(id=product_id)

        if feature_image:
            if isinstance(feature_image, list):
                feature_image = feature_image[0]

            with transaction.atomic():
                ProductImage.objects.filter(product=product, is_featured=True).update(
                    is_featured=False
                )

                if hasattr(feature_image, "name"):
                    ProductImage.objects.create(
                        product=product, image=feature_image, is_featured=True
                    )
                else:
                    return False
        else:
            return False
    except Product.DoesNotExist:
        return False


class CustomPagination(PageNumberPagination):
    page_size = 10

    def get_paginated_response(self, data):
        return Response(
            {
                "total_products": self.page.paginator.count,
                "count": len(data),
                "next": self.get_next_link(),
                "previous": self.get_previous_link(),
                "results": data,
            }
        )


def generate_basket_pdf(request):
    baskets = Basket.objects.all()

    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = 'attachment; filename="baskets.pdf"'

    pdf = canvas.Canvas(response, pagesize=A4)
    width, height = A4

    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(200, height - 40, "Basket Data")

    pdf.setFont("Helvetica", 10)

    y_position = height - 80

    headers = ["Basket Name", "Space Left", "Basket Price", "Date", "Status"]

    column_widths = [120, 60, 80, 100, 100]

    pdf.setFillColorRGB(0.2, 0.2, 0.2)
    x_position = 20
    for idx, column_width in enumerate(column_widths):
        pdf.rect(x_position, y_position, column_width, 20, fill=1)
        x_position += column_width

    pdf.setFillColorRGB(1, 1, 1)
    x_position = 20
    for idx, header in enumerate(headers):
        pdf.drawString(x_position + 5, y_position + 5, header)
        x_position += column_widths[idx]

    y_position -= 20
    line_count = 0

    for basket in baskets:
        pdf.setFillColorRGB(0, 0, 0)
        x_position = 20

        pdf.drawString(x_position, y_position, str(basket.basket_name)[:20])
        x_position += column_widths[0]

        pdf.drawString(x_position, y_position, str(basket.space_left))
        x_position += column_widths[1]

        pdf.drawString(x_position, y_position, f"{basket.basket_price:.2f}")
        x_position += column_widths[2]

        pdf.drawString(x_position, y_position, basket.date.strftime("%Y-%m-%d"))
        x_position += column_widths[3]

        pdf.drawString(x_position, y_position, basket.status)

        y_position -= 20
        line_count += 1

        if line_count >= MAX_LINES_PER_PAGE:
            pdf.showPage()
            pdf.setFont("Helvetica", 10)
            y_position = height - 80
            line_count = 0

            pdf.setFillColorRGB(0.2, 0.2, 0.2)
            x_position = 20
            for column_width in column_widths:
                pdf.rect(x_position, y_position, column_width, 20, fill=1)
                x_position += column_width

            pdf.setFillColorRGB(1, 1, 1)
            x_position = 20
            for header in headers:
                pdf.drawString(x_position + 5, y_position + 5, header)
                x_position += column_widths[headers.index(header)]

            y_position -= 20

    pdf.save()

    return response


def generate_combined_product_pdf(request):
    products = Product.objects.prefetch_related(
        "category", "sub_category", "variants", "variants__inventory_items"
    ).all()

    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = (
        f'attachment; filename="products_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf"'
    )

    pdf = canvas.Canvas(response, pagesize=A4)
    width, height = A4

    MAX_LINES_PER_PAGE = 35
    margin = 20
    row_height = 18
    header_height = 20
    section_gap = 20

    headers = ["Product Name", "Category", "SKU", "Stock", "Price", "Created Date"]
    column_widths = [100, 80, 60, 50, 60, 80]

    def add_page_header():
        pdf.setFont("Helvetica-Bold", 20)
        pdf.drawString(margin, height - 40, "Combined Product Report")

        pdf.setFont("Helvetica", 10)
        pdf.drawString(
            width - 200,
            height - 40,
            f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        )

        pdf.setStrokeColor(colors.grey)
        pdf.line(margin, height - 45, width - margin, height - 45)

    def draw_table_headers(y_position):
        pdf.setFillColor(colors.HexColor("#333333"))
        x_position = margin
        for width in column_widths:
            pdf.rect(x_position, y_position, width, header_height, fill=1)
            x_position += width

        pdf.setFillColor(colors.white)
        x_position = margin
        for idx, header in enumerate(headers):
            pdf.drawString(x_position + 5, y_position + 4, header)
            x_position += column_widths[idx]

        return y_position - header_height

    def draw_row(product, variant, y_position, line_number):
        if line_number % 2 == 0:
            pdf.setFillColor(colors.HexColor("#f5f5f5"))
            pdf.rect(margin, y_position, sum(column_widths), row_height, fill=1)

        pdf.setFillColor(colors.black)
        x_position = margin

        categories = ", ".join([cat.name for cat in product.category.all()])
        categories = categories[:27] + "..." if len(categories) > 30 else categories

        inventory = getattr(variant, "inventory_items", None)
        sku = getattr(inventory, "sku", "N/A")
        stock = getattr(inventory, "quantity", "N/A")

        created_date = product.created_at.strftime("%Y-%m-%d")

        price = getattr(variant, "price", "N/A")

        data = [product.name, categories, sku, stock, price, created_date]

        for idx, value in enumerate(data):
            pdf.drawString(x_position + 5, y_position + 4, str(value))
            x_position += column_widths[idx]

        pdf.setStrokeColor(colors.lightgrey)
        pdf.line(margin, y_position, margin + sum(column_widths), y_position)

        return y_position - row_height

    def add_footer(products):
        total_products = len(products)
        total_variants = sum(len(p.variants.all()) for p in products)

        footer_y = 50
        pdf.setFillColor(colors.HexColor("#f8f8f8"))
        pdf.rect(margin, footer_y - 30, sum(column_widths), 40, fill=1)

        pdf.setFillColor(colors.black)
        pdf.setFont("Helvetica-Bold", 10)
        pdf.drawString(margin + 5, footer_y, f"Total Products: {total_products}")
        pdf.drawString(margin + 150, footer_y, f"Total Variants: {total_variants}")

        pdf.setFont("Helvetica", 8)
        pdf.drawString(width - 40, 20, f"Page {pdf.getPageNumber()}")

    y_position = height - 80
    line_count = 0
    add_page_header()
    y_position -= section_gap
    y_position = draw_table_headers(y_position)

    for product in products:
        variants = product.variants.all()
        for variant in variants:
            if line_count >= MAX_LINES_PER_PAGE:
                pdf.showPage()
                pdf.setFont("Helvetica", 10)
                add_page_header()
                y_position = height - 80
                y_position -= section_gap
                y_position = draw_table_headers(y_position)
                line_count = 0

            y_position = draw_row(product, variant, y_position, line_count)
            line_count += 1

    add_footer(products)

    pdf.save()
    return response



class BasketCustomPagination(PageNumberPagination):
    page_size = 4  # ✅ Limits to 4 records per page
    page_size_query_param = "page_size"
    max_page_size = 100