use anchor_lang::prelude::*;

#[error_code]
pub enum GorEdaError {
    #[msg("Invalid order status for this operation")]
    InvalidOrderStatus = 6000,

    #[msg("Unauthorized: only buyer can complete this action")]
    UnauthorizedBuyer = 6001,

    #[msg("Unauthorized: only seller can complete this action")]
    UnauthorizedSeller = 6002,

    #[msg("Unauthorized: only validator can complete this action")]
    UnauthorizedValidator = 6003,

    #[msg("Escrow amount mismatch")]
    EscrowAmountMismatch = 6004,

    #[msg("Insufficient escrow balance")]
    InsufficientEscrowBalance = 6005,

    #[msg("Product not found or invalid")]
    InvalidProductId = 6006,

    #[msg("Refund window expired")]
    RefundWindowExpired = 6007,
}
