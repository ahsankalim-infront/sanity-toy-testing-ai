-- Kidlo parallel schema. JSON collections use the same table and column names.
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT NULL,
  `name` VARCHAR(255) NULL,
  `email` VARCHAR(255) NULL,
  `password_hash` VARCHAR(255) NULL,
  `role` VARCHAR(255) NULL,
  `created_at` VARCHAR(255) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT NULL,
  `slug` VARCHAR(255) NULL,
  `name` VARCHAR(255) NULL,
  `emoji` VARCHAR(255) NULL,
  `blurb` VARCHAR(255) NULL,
  `color` VARCHAR(255) NULL,
  `count_label` VARCHAR(255) NULL,
  `parent_slug` VARCHAR(255) NULL,
  `group_name` VARCHAR(255) NULL,
  `nav_group` VARCHAR(255) NULL,
  `filter_tag` VARCHAR(255) NULL,
  `sort_order` INT NULL,
  `show_on_home` TINYINT NULL,
  `show_in_footer` TINYINT NULL,
  `show_in_nav` TINYINT NULL,
  `virtual` VARCHAR(255) NULL,
  `virtual_value` VARCHAR(255) NULL,
  `active` TINYINT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `products` (
  `id` INT NULL,
  `slug` VARCHAR(255) NULL,
  `name` VARCHAR(255) NULL,
  `emoji` VARCHAR(255) NULL,
  `category_slug` VARCHAR(255) NULL,
  `gender` VARCHAR(255) NULL,
  `age_min` INT NULL,
  `age_max` INT NULL,
  `age_label` VARCHAR(255) NULL,
  `price` INT NULL,
  `compare_price` INT NULL,
  `badge` VARCHAR(255) NULL,
  `rating` DECIMAL(4,2) NULL,
  `review_count` INT NULL,
  `stock` INT NULL,
  `sold` INT NULL,
  `description` TEXT NULL,
  `gradient` VARCHAR(255) NULL,
  `brand` VARCHAR(255) NULL,
  `sku` VARCHAR(255) NULL,
  `tags` VARCHAR(255) NULL,
  `featured` TINYINT NULL,
  `is_deal` TINYINT NULL,
  `active` TINYINT NULL,
  `created_at` VARCHAR(255) NULL,
  `updated_at` VARCHAR(255) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sections` (
  `id` INT NULL,
  `section_key` VARCHAR(255) NULL,
  `name` VARCHAR(255) NULL,
  `enabled` TINYINT NULL,
  `sort_order` INT NULL,
  `payload` LONGTEXT NULL,
  `updated_at` VARCHAR(255) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pages` (
  `id` INT NULL,
  `slug` VARCHAR(255) NULL,
  `title` VARCHAR(255) NULL,
  `group_name` VARCHAR(255) NULL,
  `excerpt` VARCHAR(255) NULL,
  `content` TEXT NULL,
  `emoji` VARCHAR(255) NULL,
  `enabled` TINYINT NULL,
  `sort_order` INT NULL,
  `updated_at` VARCHAR(255) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `blog_posts` (
  `id` INT NULL,
  `slug` VARCHAR(255) NULL,
  `title` VARCHAR(255) NULL,
  `category` VARCHAR(255) NULL,
  `excerpt` VARCHAR(255) NULL,
  `content` TEXT NULL,
  `emoji` VARCHAR(255) NULL,
  `gradient` VARCHAR(255) NULL,
  `author` VARCHAR(255) NULL,
  `read_time` VARCHAR(255) NULL,
  `published_at` VARCHAR(255) NULL,
  `enabled` TINYINT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `reviews` (
  `id` INT NULL,
  `product_id` INT NULL,
  `author` VARCHAR(255) NULL,
  `city` VARCHAR(255) NULL,
  `role` VARCHAR(255) NULL,
  `avatar` VARCHAR(255) NULL,
  `stars` INT NULL,
  `text` TEXT NULL,
  `verified` TINYINT NULL,
  `enabled` TINYINT NULL,
  `created_at` VARCHAR(255) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT NULL,
  `order_no` VARCHAR(255) NULL,
  `customer_name` VARCHAR(255) NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(255) NULL,
  `address` VARCHAR(255) NULL,
  `city` VARCHAR(255) NULL,
  `country_code` VARCHAR(255) NULL,
  `country_name` VARCHAR(255) NULL,
  `dial_code` VARCHAR(255) NULL,
  `payment_method` VARCHAR(255) NULL,
  `status` VARCHAR(255) NULL,
  `subtotal` INT NULL,
  `shipping` INT NULL,
  `discount` INT NULL,
  `total` INT NULL,
  `coupon_code` VARCHAR(255) NULL,
  `notes` TEXT NULL,
  `created_at` VARCHAR(255) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT NULL,
  `order_id` INT NULL,
  `product_id` INT NULL,
  `name` VARCHAR(255) NULL,
  `emoji` VARCHAR(255) NULL,
  `price` INT NULL,
  `qty` INT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `coupons` (
  `id` INT NULL,
  `code` VARCHAR(255) NULL,
  `type` VARCHAR(255) NULL,
  `value` INT NULL,
  `min_order` INT NULL,
  `active` TINYINT NULL,
  `description` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `customers` (
  `id` INT NULL,
  `name` VARCHAR(255) NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(255) NULL,
  `password_hash` VARCHAR(255) NULL,
  `created_at` VARCHAR(255) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `newsletter` (
  `id` INT NULL,
  `email` VARCHAR(255) NULL,
  `created_at` VARCHAR(255) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `countries` (
  `id` INT NULL,
  `code` VARCHAR(255) NULL,
  `name` VARCHAR(255) NULL,
  `dial` VARCHAR(255) NULL,
  `flag` VARCHAR(255) NULL,
  `example` VARCHAR(255) NULL,
  `digits` INT NULL,
  `active` TINYINT NULL,
  `sort_order` INT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cities` (
  `id` INT NULL,
  `country_code` VARCHAR(255) NULL,
  `name` VARCHAR(255) NULL,
  `active` TINYINT NULL,
  `sort_order` INT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `inquiries` (
  `id` INT NULL,
  `type` VARCHAR(255) NULL,
  `name` VARCHAR(255) NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(255) NULL,
  `message` TEXT NULL,
  `status` VARCHAR(255) NULL,
  `created_at` VARCHAR(255) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
