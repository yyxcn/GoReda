use anchor_lang::prelude::*;
use anchor_lang::system_program;

use crate::state::EscrowAccount;

/// Transfer SOL from buyer (signer) to escrow PDA via system_program CPI.
/// This works because the buyer is a signer and system-owned.
pub fn fund_escrow<'info>(
    from: &Signer<'info>,
    to_escrow: &Account<'info, EscrowAccount>,
    system_program: &Program<'info, system_program::System>,
    amount: u64,
) -> Result<()> {
    let cpi_ctx = CpiContext::new(
        system_program.to_account_info(),
        system_program::Transfer {
            from: from.to_account_info(),
            to: to_escrow.to_account_info(),
        },
    );
    system_program::transfer(cpi_ctx, amount)?;
    Ok(())
}

/// Transfer SOL from program-owned escrow PDA to seller.
/// Direct lamport manipulation — system_program::transfer does NOT work
/// from accounts owned by the program.
pub fn release_escrow<'info>(
    escrow: &Account<'info, EscrowAccount>,
    to_seller: &SystemAccount<'info>,
    amount: u64,
) -> Result<()> {
    **escrow.to_account_info().try_borrow_mut_lamports()? -= amount;
    **to_seller.to_account_info().try_borrow_mut_lamports()? += amount;
    Ok(())
}

/// Transfer SOL from program-owned escrow PDA back to buyer (refund).
pub fn refund_escrow<'info>(
    escrow: &Account<'info, EscrowAccount>,
    to_buyer: &Signer<'info>,
    amount: u64,
) -> Result<()> {
    **escrow.to_account_info().try_borrow_mut_lamports()? -= amount;
    **to_buyer.to_account_info().try_borrow_mut_lamports()? += amount;
    Ok(())
}
