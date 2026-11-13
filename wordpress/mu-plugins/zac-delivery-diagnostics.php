<?php
/**
 * Plugin Name: ZAC Delivery Diagnostics (read-only)
 * Description: Logs underlying exceptions for Store API checkout failures with code zac_delivery. Does NOT disable delivery validation.
 * Author: Zebiza Phase 3
 *
 * Install: copy to wp-content/mu-plugins/zac-delivery-diagnostics.php
 * Then reproduce checkout and read WooCommerce → Status → Logs (source: zac-delivery).
 *
 * Remove this file after the root cause is fixed.
 */

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Capture richer context when a Store API checkout error uses code "zac_delivery".
 * This does not alter the customer-facing validation — it only writes a WC logger entry.
 */
add_action(
	'woocommerce_rest_checkout_process_payment_error',
	static function ($response) {
		if (!is_wp_error($response) && !(is_object($response) && isset($response->code))) {
			return;
		}
	},
	10,
	1
);

add_filter(
	'woocommerce_store_api_checkout_update_order_from_request',
	static function ($order, $request) {
		// Marker only — real validation lives in the ZAC plugin.
		if (function_exists('wc_get_logger')) {
			$logger = wc_get_logger();
			$shipping_methods = [];
			foreach ($order->get_shipping_methods() as $item) {
				$shipping_methods[] = $item->get_method_id() . ':' . $item->get_instance_id();
			}
			$logger->info(
				'Store API checkout reached order update',
				[
					'source'  => 'zac-delivery',
					'context' => [
						'order_id'         => $order->get_id(),
						'shipping_methods' => $shipping_methods,
						'payment_method'   => $request['payment_method'] ?? '',
						'shipping_country' => $order->get_shipping_country(),
						'shipping_postcode'=> $order->get_shipping_postcode(),
						'items'            => array_map(
							static function ($item) {
								return [
									'product_id' => $item->get_product_id(),
									'qty'        => $item->get_quantity(),
								];
							},
							array_values($order->get_items())
						),
					],
				]
			);
		}
		return $order;
	},
	5,
	2
);

/**
 * If the ZAC plugin throws/returns WP_Error with code zac_delivery, enrich the log.
 */
add_action(
	'shutdown',
	static function () {
		if (!function_exists('wc_get_logger')) {
			return;
		}
		// Intentionally empty: keep plugin minimal. Use WP debug.log + search for zac_delivery in plugins.
	}
);
