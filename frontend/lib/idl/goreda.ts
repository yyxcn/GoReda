/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/goreda.json`.
 */
export type Goreda = {
  "address": "ASQCCGt2VKtnMCkrTUurr7u49ZcrCMrjL4q4kFsKGCa2",
  "metadata": {
    "name": "goreda",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "closeOrder",
      "docs": [
        "Close an already-refunded or completed order to free the PDA."
      ],
      "discriminator": [
        90,
        103,
        209,
        28,
        7,
        63,
        168,
        4
      ],
      "accounts": [
        {
          "name": "buyer",
          "writable": true,
          "signer": true,
          "relations": [
            "order"
          ]
        },
        {
          "name": "order",
          "writable": true
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "order"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "completeOrder",
      "docs": [
        "Buyer confirms delivery. Escrow is released to seller."
      ],
      "discriminator": [
        73,
        78,
        89,
        7,
        140,
        132,
        17,
        97
      ],
      "accounts": [
        {
          "name": "buyer",
          "signer": true,
          "relations": [
            "order"
          ]
        },
        {
          "name": "seller",
          "writable": true
        },
        {
          "name": "order",
          "writable": true
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "order"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "confirmOrder",
      "docs": [
        "Seller confirms the order."
      ],
      "discriminator": [
        142,
        28,
        201,
        134,
        143,
        201,
        118,
        244
      ],
      "accounts": [
        {
          "name": "seller",
          "signer": true,
          "relations": [
            "order"
          ]
        },
        {
          "name": "order",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "purchase",
      "docs": [
        "Buyer purchases a product. Creates Order + Escrow PDAs, locks SOL."
      ],
      "discriminator": [
        21,
        93,
        113,
        154,
        193,
        160,
        242,
        168
      ],
      "accounts": [
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "seller"
        },
        {
          "name": "order",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "buyer"
              },
              {
                "kind": "arg",
                "path": "productId"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "order"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "productId",
          "type": "u64"
        },
        {
          "name": "price",
          "type": "u64"
        }
      ]
    },
    {
      "name": "refund",
      "docs": [
        "Instant refund. Allowed before SHIPPED_TO_VALIDATOR.",
        "close = buyer on both accounts: all lamports (price + rent) returned,",
        "PDA freed so the same product can be re-purchased."
      ],
      "discriminator": [
        2,
        96,
        183,
        251,
        63,
        208,
        46,
        46
      ],
      "accounts": [
        {
          "name": "buyer",
          "writable": true,
          "signer": true,
          "relations": [
            "order"
          ]
        },
        {
          "name": "order",
          "writable": true
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "order"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "shipToBuyer",
      "docs": [
        "Validator ships to buyer after verification."
      ],
      "discriminator": [
        134,
        138,
        217,
        210,
        167,
        85,
        37,
        80
      ],
      "accounts": [
        {
          "name": "validator",
          "signer": true,
          "relations": [
            "order"
          ]
        },
        {
          "name": "order",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "trackingNumber",
          "type": "string"
        }
      ]
    },
    {
      "name": "shipToValidator",
      "docs": [
        "Seller ships to validator. Records validator pubkey and tracking number."
      ],
      "discriminator": [
        156,
        56,
        48,
        220,
        211,
        217,
        42,
        112
      ],
      "accounts": [
        {
          "name": "seller",
          "signer": true,
          "relations": [
            "order"
          ]
        },
        {
          "name": "order",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "validatorPubkey",
          "type": "pubkey"
        },
        {
          "name": "trackingNumber",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "escrowAccount",
      "discriminator": [
        36,
        69,
        48,
        18,
        128,
        225,
        125,
        135
      ]
    },
    {
      "name": "order",
      "discriminator": [
        134,
        173,
        223,
        185,
        77,
        86,
        28,
        51
      ]
    }
  ],
  "errors": [
    {
      "code": 12000,
      "name": "invalidOrderStatus",
      "msg": "Invalid order status for this operation"
    },
    {
      "code": 12001,
      "name": "unauthorizedBuyer",
      "msg": "Unauthorized: only buyer can complete this action"
    },
    {
      "code": 12002,
      "name": "unauthorizedSeller",
      "msg": "Unauthorized: only seller can complete this action"
    },
    {
      "code": 12003,
      "name": "unauthorizedValidator",
      "msg": "Unauthorized: only validator can complete this action"
    },
    {
      "code": 12004,
      "name": "escrowAmountMismatch",
      "msg": "Escrow amount mismatch"
    },
    {
      "code": 12005,
      "name": "insufficientEscrowBalance",
      "msg": "Insufficient escrow balance"
    },
    {
      "code": 12006,
      "name": "invalidProductId",
      "msg": "Product not found or invalid"
    },
    {
      "code": 12007,
      "name": "refundWindowExpired",
      "msg": "Refund window expired"
    }
  ],
  "types": [
    {
      "name": "escrowAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "order",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "order",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "buyer",
            "type": "pubkey"
          },
          {
            "name": "seller",
            "type": "pubkey"
          },
          {
            "name": "validator",
            "type": "pubkey"
          },
          {
            "name": "productId",
            "type": "u64"
          },
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "orderStatus"
              }
            }
          },
          {
            "name": "trackingToValidator",
            "type": "string"
          },
          {
            "name": "trackingToBuyer",
            "type": "string"
          },
          {
            "name": "txHashToValidator",
            "type": "string"
          },
          {
            "name": "txHashToBuyer",
            "type": "string"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "updatedAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "orderStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "purchased"
          },
          {
            "name": "orderConfirmed"
          },
          {
            "name": "shippedToValidator"
          },
          {
            "name": "validated"
          },
          {
            "name": "shippedToBuyer"
          },
          {
            "name": "delivered"
          },
          {
            "name": "completed"
          },
          {
            "name": "refunded"
          }
        ]
      }
    }
  ]
};
