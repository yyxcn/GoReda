use anchor_lang::prelude::*;

pub mod errors;
pub mod escrow;
pub mod state;

use errors::GorEdaError;
use escrow::*;
use state::*;

declare_id!("ASQCCGt2VKtnMCkrTUurr7u49ZcrCMrjL4q4kFsKGCa2");

#[program]
pub mod goreda {
    use super::*;

    /// Buyer purchases a product. Creates Order + Escrow PDAs, locks SOL.
    pub fn purchase(
        ctx: Context<Purchase>,
        product_id: u64,
        price: u64,
    ) -> Result<()> {
        let clock = Clock::get()?;

        // Init order
        let order = &mut ctx.accounts.order;
        order.buyer = ctx.accounts.buyer.key();
        order.seller = ctx.accounts.seller.key();
        order.validator = Pubkey::default();
        order.product_id = product_id;
        order.price = price;
        order.status = OrderStatus::Purchased;
        order.tracking_to_validator = String::new();
        order.tracking_to_buyer = String::new();
        order.tx_hash_to_validator = String::new();
        order.tx_hash_to_buyer = String::new();
        order.created_at = clock.unix_timestamp;
        order.updated_at = clock.unix_timestamp;
        order.bump = ctx.bumps.order;

        // Transfer SOL from buyer into escrow PDA (before mutable borrow)
        let order_key = order.key();
        fund_escrow(
            &ctx.accounts.buyer,
            &ctx.accounts.escrow,
            &ctx.accounts.system_program,
            price,
        )?;

        // Init escrow fields
        let escrow = &mut ctx.accounts.escrow;
        escrow.order = order_key;
        escrow.bump = ctx.bumps.escrow;
        escrow.amount = price;

        msg!("Order purchased: product_id={}, price={}", product_id, price);
        Ok(())
    }

    /// Seller confirms the order.
    pub fn confirm_order(ctx: Context<ConfirmOrder>) -> Result<()> {
        let order = &mut ctx.accounts.order;

        require!(
            order.status == OrderStatus::Purchased,
            GorEdaError::InvalidOrderStatus
        );

        order.status = OrderStatus::OrderConfirmed;
        order.updated_at = Clock::get()?.unix_timestamp;

        msg!("Order confirmed by seller");
        Ok(())
    }

    /// Seller ships to validator. Records validator pubkey and tracking number.
    pub fn ship_to_validator(
        ctx: Context<ShipToValidator>,
        validator_pubkey: Pubkey,
        tracking_number: String,
    ) -> Result<()> {
        let order = &mut ctx.accounts.order;

        require!(
            order.status == OrderStatus::OrderConfirmed,
            GorEdaError::InvalidOrderStatus
        );

        order.validator = validator_pubkey;
        order.status = OrderStatus::ShippedToValidator;
        order.tracking_to_validator = tracking_number;
        order.updated_at = Clock::get()?.unix_timestamp;

        msg!("Shipped to validator: {}", validator_pubkey);
        Ok(())
    }

    /// Validator ships to buyer after verification.
    pub fn ship_to_buyer(
        ctx: Context<ShipToBuyer>,
        tracking_number: String,
    ) -> Result<()> {
        let order = &mut ctx.accounts.order;

        require!(
            order.status == OrderStatus::ShippedToValidator,
            GorEdaError::InvalidOrderStatus
        );

        order.status = OrderStatus::ShippedToBuyer;
        order.tracking_to_buyer = tracking_number;
        order.updated_at = Clock::get()?.unix_timestamp;

        msg!("Shipped to buyer from validator");
        Ok(())
    }

    /// Buyer confirms delivery. Escrow is released to seller.
    pub fn complete_order(ctx: Context<CompleteOrder>) -> Result<()> {
        let order = &mut ctx.accounts.order;

        require!(
            order.status == OrderStatus::ShippedToBuyer,
            GorEdaError::InvalidOrderStatus
        );
        require!(
            order.price == ctx.accounts.escrow.amount,
            GorEdaError::EscrowAmountMismatch
        );

        let price = order.price;

        release_escrow(
            &ctx.accounts.escrow,
            &ctx.accounts.seller,
            price,
        )?;

        ctx.accounts.escrow.amount = 0;
        order.status = OrderStatus::Completed;
        order.updated_at = Clock::get()?.unix_timestamp;

        msg!("Order completed — escrow released to seller");
        Ok(())
    }

    /// Instant refund. Allowed before SHIPPED_TO_VALIDATOR.
    /// close = buyer on both accounts: all lamports (price + rent) returned,
    /// PDA freed so the same product can be re-purchased.
    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        let order = &ctx.accounts.order;

        require!(
            order.status == OrderStatus::Purchased
                || order.status == OrderStatus::OrderConfirmed,
            GorEdaError::InvalidOrderStatus
        );

        msg!("Order refunded to buyer — accounts closed");
        Ok(())
    }

    /// Close an already-refunded or completed order to free the PDA.
    pub fn close_order(ctx: Context<CloseOrder>) -> Result<()> {
        let order = &ctx.accounts.order;

        require!(
            order.status == OrderStatus::Refunded
                || order.status == OrderStatus::Completed,
            GorEdaError::InvalidOrderStatus
        );

        msg!("Order account closed");
        Ok(())
    }
}

// ============================================================================
// Account Contexts
// ============================================================================

#[derive(Accounts)]
#[instruction(product_id: u64, price: u64)]
pub struct Purchase<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: seller pubkey — not a signer for this instruction.
    pub seller: UncheckedAccount<'info>,

    #[account(
        init,
        payer = buyer,
        space = Order::SPACE,
        seeds = [b"order", buyer.key().as_ref(), product_id.to_le_bytes().as_ref()],
        bump
    )]
    pub order: Account<'info, Order>,

    #[account(
        init,
        payer = buyer,
        space = EscrowAccount::SPACE,
        seeds = [b"escrow", order.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, EscrowAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ConfirmOrder<'info> {
    pub seller: Signer<'info>,

    #[account(mut, has_one = seller)]
    pub order: Account<'info, Order>,
}

#[derive(Accounts)]
pub struct ShipToValidator<'info> {
    pub seller: Signer<'info>,

    #[account(mut, has_one = seller)]
    pub order: Account<'info, Order>,
}

#[derive(Accounts)]
pub struct ShipToBuyer<'info> {
    pub validator: Signer<'info>,

    #[account(mut, has_one = validator)]
    pub order: Account<'info, Order>,
}

#[derive(Accounts)]
pub struct CompleteOrder<'info> {
    pub buyer: Signer<'info>,

    /// CHECK: seller receives the escrowed funds.
    #[account(mut)]
    pub seller: SystemAccount<'info>,

    #[account(mut, has_one = buyer)]
    pub order: Account<'info, Order>,

    #[account(
        mut,
        seeds = [b"escrow", order.key().as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, EscrowAccount>,
}

#[derive(Accounts)]
pub struct Refund<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(mut, has_one = buyer, close = buyer)]
    pub order: Account<'info, Order>,

    #[account(
        mut,
        seeds = [b"escrow", order.key().as_ref()],
        bump = escrow.bump,
        close = buyer
    )]
    pub escrow: Account<'info, EscrowAccount>,
}

#[derive(Accounts)]
pub struct CloseOrder<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(mut, has_one = buyer, close = buyer)]
    pub order: Account<'info, Order>,

    #[account(
        mut,
        seeds = [b"escrow", order.key().as_ref()],
        bump = escrow.bump,
        close = buyer
    )]
    pub escrow: Account<'info, EscrowAccount>,
}
