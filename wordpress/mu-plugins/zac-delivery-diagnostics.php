<?php
/**
 * Plugin Name: ZAC Delivery Diagnostics (read-only)
 * Description: Logs context when Store API checkout fails with code zac_delivery. Does NOT disable delivery validation or change customer-facing behaviour.
 * Author: Zebiza Phase 4
 *
 * Install: copy to wp-content/mu-plugins/zac-delivery-diagnostics.php on the WordPress host.
 * Reproduce a failing checkout, then open WooCommerce → Status → Logs (source: zac-delivery).
 * Remove this file after the root cause is fixed.
 *
 * Privacy: logs product IDs, shipping method IDs, postcode/country only — not full street address, email, phone, or payment tokens.
 */

if (!defined('ABSPATH')) {
	exit;
}

/**
 * @param mixed $result
 */
function zebiza_zac_delivery_maybe_log($result, $server = null, $request = null) {
	if (!function_exists('wc_get_logger')) {
		return $result;
	}

	$code = null;
	$message = null;
	if (is_wp_error($result)) {
		$code = $result->get_error_code();
		$message = $result->get_error_message();
	} elseif (is_array($result) && isset($result['code'])) {
		$code = $result['code'];
		$message = $result['message'] ?? '';
	} elseif ($result instanceof WP_REST_Response) {
		$data = $result->get_data();
		if (is_array($data) && isset($data['code'])) {
			$code = $data['code'];
			$message = $data['message'] ?? '';
		}
	}

	if ($code !== 'zac_delivery') {
		return $result;
	}

	$route = '';
	$method = '';
	$payment = '';
	$postcode = '';
	$country = '';
	if ($request instanceof WP_REST_Request) {
		$route = (string) $request->get_route();
		$method = (string) $request->get_method();
		$payment = (string) $request->get_param('payment_method');
		$ship = $request->get_param('shipping_address');
		if (is_array($ship)) {
			$postcode = isset($ship['postcode']) ? (string) $ship['postcode'] : '';
			$country = isset($ship['country']) ? (string) $ship['country'] : '';
		}
	}

	wc_get_logger()->warning(
		'zac_delivery blocked Store API checkout',
		[
			'source'  => 'zac-delivery',
			'context' => [
				'route'          => $route,
				'http_method'    => $method,
				'payment_method' => $payment,
				'ship_postcode'  => $postcode,
				'ship_country'   => $country,
				'message'        => is_string($message) ? wp_strip_all_tags($message) : '',
				// Hint for operators: find the throwing plugin.
				'grep_hint'      => 'grep -R zac_delivery wp-content/plugins wp-content/mu-plugins',
			],
		]
	);

	return $result;
}

add_filter('rest_request_after_callbacks', 'zebiza_zac_delivery_maybe_log', 10, 3);

add_filter(
	'woocommerce_store_api_checkout_update_order_from_request',
	static function ($order, $request) {
		if (!function_exists('wc_get_logger') || !$order instanceof WC_Order) {
			return $order;
		}
		$shipping_methods = [];
		foreach ($order->get_shipping_methods() as $item) {
			$shipping_methods[] = $item->get_method_id() . ':' . $item->get_instance_id();
		}
		$item_ids = [];
		foreach ($order->get_items() as $item) {
			$item_ids[] = [
				'product_id' => (int) $item->get_product_id(),
				'qty'        => (int) $item->get_quantity(),
			];
		}
		wc_get_logger()->info(
			'Store API checkout order update (pre-payment)',
			[
				'source'  => 'zac-delivery',
				'context' => [
					'order_id'          => (int) $order->get_id(),
					'shipping_methods'  => $shipping_methods,
					'payment_method'    => (string) ($request['payment_method'] ?? ''),
					'shipping_country'  => (string) $order->get_shipping_country(),
					'shipping_postcode' => (string) $order->get_shipping_postcode(),
					'items'             => $item_ids,
				],
			]
		);
		return $order;
	},
	5,
	2
);
