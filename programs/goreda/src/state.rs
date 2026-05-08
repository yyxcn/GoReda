use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Debug)]
pub enum OrderStatus {
    Purchased = 0,
    OrderConfirmed = 1,
    ShippedToValidator = 2,
    Validated = 3,
    ShippedToBuyer = 4,
    Delivered = 5,
    Completed = 6,
    Refunded = 7,
}

#[account]
pub struct Order {
    pub buyer: Pubkey,                    // 32
    pub seller: Pubkey,                   // 32
    pub validator: Pubkey,                // 32 (Pubkey::default() if not assigned)
    pub product_id: u64,                  // 8
    pub price: u64,                       // 8 (lamports)
    pub status: OrderStatus,              // 1
    pub tracking_to_validator: String,    // 4 + len (mock tracking number)
    pub tracking_to_buyer: String,        // 4 + len
    pub tx_hash_to_validator: String,     // 4 + len (Solscan tx hash)
    pub tx_hash_to_buyer: String,         // 4 + len
    pub created_at: i64,                  // 8
    pub updated_at: i64,                  // 8
    pub bump: u8,                         // 1
}

// Space calculation:
// discriminator: 8
// buyer: 32
// seller: 32
// validator: 32
// product_id: 8
// price: 8
// status: 1
// tracking_to_validator: 4 + 30 = 34
// tracking_to_buyer: 4 + 30 = 34
// tx_hash_to_validator: 4 + 66 = 70 (Solana tx hash hex string)
// tx_hash_to_buyer: 4 + 66 = 70
// created_at: 8
// updated_at: 8
// bump: 1
// Total: 8 + 32 + 32 + 32 + 8 + 8 + 1 + 34 + 34 + 70 + 70 + 8 + 8 + 1 = 346

impl Order {
    pub const SPACE: usize = 8 + 32 + 32 + 32 + 8 + 8 + 1 + 4 + 30 + 4 + 30 + 4 + 66 + 4 + 66 + 8 + 8 + 1;
}

#[account]
pub struct EscrowAccount {
    pub order: Pubkey,      // 32
    pub amount: u64,        // 8
    pub bump: u8,           // 1
}

impl EscrowAccount {
    pub const SPACE: usize = 8 + 32 + 8 + 1;
}
