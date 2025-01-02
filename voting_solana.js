

//////////---------------------------------------------------------------------////////

import { FC, useEffect, useState } from "react";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { Program, AnchorProvider, web3, BN } from "@project-serum/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import idl from "../../../anchor/target/idl/voteTest.json";
import * as anchor from "@coral-xyz/anchor";
import { useDispatch, useSelector } from "react-redux";
import {initializCandidates, initializpolls, initializVotes, resetState } from "@/reduxSetup/voterInfo";


const programID = new PublicKey("Dvr7cy9KKAtxKtTz4eSqYG9dwvEVzvLSViEFE7DerSSS");
const network = "https://api.devnet.solana.com";

const opts = {
    preflightCommitment: "processed" as web3.Commitment,
};

const Votee: FC = () => {
    const { publicKey, signTransaction, signAllTransactions } = useWallet(); // Access wallet functions
    const [message, setMessage] = useState<string>("");
    const [pollId, setPollId] = useState("");
    const [description, setDescription] = useState("");
    const [pollStart, setPollStart] = useState("");
    const [pollEnd, setPollEnd] = useState("");
    const [txHash, setTxHash] = useState("");
    const [CanditxHash, setTxHashCandi] = useState("");
    const [voteTxHash, setTxHashVote] = useState("");

    const [pollIdinit, setPollIdinit] = useState("");
    const [nameinit, setNameinit] = useState("");

    const [pollIdVote, setPollIdVote] = useState("");
    const [nameVote, setNameVote] = useState("");
    
    const [poolinitAll, setAllPoolInit] = useState<any[]>([]);
    const [poolCandidateAll, setAllCandidateInit] = useState<any[]>([]);
    const dispatch: any = useDispatch();

    const initPools = useSelector((state: any) => state.counter.pools);
    const initCandidates = useSelector((state: any) => state.counter.candidate);
    // console.log("publicKey==>", publicKey?.toBase58());

    // ////useEffect
    useEffect(() => {
    //  resetState()
     setTimeout(() => {
        //  pollInitDataCall();
         readInitializeCandidates();
     }, 200);
    }, []);

    useEffect(()=>{
        setPollIdinit("")
        setNameinit("")
        readInitializeCandidates()
        setTimeout(() => {
            setTxHashCandi("")
        }, 200);
        resetState()
    }, [CanditxHash])

    useEffect(()=>{
        setPollIdVote("")
        setNameVote("")
        readInitializeCandidates()
        setTimeout(() => {
            setTxHashVote("")
        }, 200);
    }, [voteTxHash])

    useEffect(() => {
        resetState()
        setPollId("")
        setDescription("")
        setPollStart("")
        setPollEnd("")
        readInitializePoll()
        setTimeout(() => {
            setTxHash("")
        }, 200);
    }, [txHash])

    ////Provider
    const getProvider = (): AnchorProvider => {
        const connection = new Connection(network, opts.preflightCommitment);
        if (!publicKey || !signTransaction || !signAllTransactions) {
            throw new Error("Wallet is not connected or incomplete.");
        }
        // Use the wallet from `useWallet`
        const wallet = {
            publicKey, 
            signTransaction,
            signAllTransactions,
        };
        return new AnchorProvider(connection, wallet, opts);
    };
    const provider = getProvider();
    const program = new Program(idl as any, programID, provider);

    ////----------------FN------------------------
    ////candidateNameBytes fn
    const candidateNameBytes = (Name: any) => {
        return (Buffer.from(Name.toString())); //new name)
    }

    //// pollIdBytes fn---------------------------
    const pollIdBytes = (pId: any) => {
        const pollIdBigInt = BigInt(new anchor.BN(pId)); // Convert to bigint
        return (Buffer.from(new BigUint64Array([pollIdBigInt]).buffer));
    }
    console.log("pollIdBytes(pollId==>", pollIdBytes(pollId));

    ///fn read ------------------------------------------
    const readInitializePoll = async () => {
        try {
            const final: any = await program.account.poll.all(); // Fetch from blockchain
            console.log("Fetched_readInitializePoll==>", final);
            await setAllPoolInit( final);
        } catch (err) {
            console.error("Transaction error:", err);
            setMessage("Transaction failed!");
        }
    };
    
    /// fn read intialize candidate
    const readInitializeCandidates = async () => {
        try {
            const final: any = await program.account.candidate.all(); // Fetch from blockchain
            console.log("Fetched_candidate_Data==>:", final);
            ///// Update state with new pool data
            setAllCandidateInit(final);
        } catch (err) {
            console.error("Transaction error:", err);
            setMessage("Transaction failed!");
        }
    };

    ////main fn -----------------------------------------------------------------------
    ///--------------------------------------------------------------------------------
    const sayHello = async (value:string) => {
        try {
        ////---------------------------------1---------------------------------
            if(value ==="initializePoll"){
                const [pollPda, bump] = anchor.web3.PublicKey.findProgramAddressSync([pollIdBytes(pollId)], program.programId);
                console.log("initializePoll_PDA:===>", pollPda.toBase58());
                const tx = await program.methods
                .initializePoll(
                    new anchor.BN(Number(pollId)),
                    description,
                    new anchor.BN(Number(pollStart)),
                    new anchor.BN(Number(pollEnd))
                )
                .accounts({
                    signer: publicKey, // The signer of the transaction
                    poll: pollPda,     // Use the new account's public key
                    systemProgram: SystemProgram.programId, // Solana's system program
                })
                .rpc();
                console.log("Transaction signature:", tx);
                setTxHash(tx);
                setMessage("InitializePoll successfully!");
                }
        ////---------------------------------2--------------------------------
            if (value === "initializeCandidate") {
                console.log("initializeCandidate Entry");
                // Derive the PDA2
                const [pollPdainit, bump] = anchor.web3.PublicKey.findProgramAddressSync([pollIdBytes(pollIdinit)], program.programId);
                console.log("PDA:", pollPdainit.toBase58());
                const seeds2 = [pollIdBytes(pollIdinit), candidateNameBytes(nameinit)]
                // const seeds2 = [pollIdBytes(3), candidateNameBytes("three")]
                const [candidatePda] = anchor.web3.PublicKey.findProgramAddressSync(
                    seeds2, // Array of seeds (pollId + candidateName)
                    program.programId // Your program's public key
                );
                console.log("candidatePDA==>:", candidatePda.toBase58());
                   const tx =await program.methods
                    .initializeCandidate(candidateNameBytes(nameinit),new anchor.BN(Number(pollIdinit)))
                    .accounts({
                        signer: publicKey, // The signer of the transaction
                        poll: pollPdainit, // Use the new account's public key
                        candidate: candidatePda, // Use the new account's public key
                        systemProgram: SystemProgram.programId, // Solana's system program
                    })
                    // .signers([newAccountKeypair]) // Add the generated keypair as a signer
                    .rpc();
                console.log("Transaction signature:", tx);
                await readInitializeCandidates()
                setTxHashCandi(tx);
                //redux setup
                const newcandidate: any = {
                    signer: publicKey?.toString(), // Ensure publicKey is available
                    pool_id: Number(pollId), // Convert pollId to a number
                    candidatePda: candidatePda.toString(),
                };
                await dispatch(initializCandidates(newcandidate));
                setMessage("initializeCandidate successfully!");

            }
            ////---------------------------------3---------------------------------
            if (value === "vote") {
                console.log("vote Entry");
                // Derive the PDA3
                const [pollPdaVote] = anchor.web3.PublicKey.findProgramAddressSync([pollIdBytes(pollIdVote)], program.programId);
                console.log("PDA:", pollPdaVote.toBase58());
                const seeds2 = [pollIdBytes(pollIdVote), candidateNameBytes(nameVote)]

                const signerSeed = publicKey.toBuffer();
                const seed3 = [pollIdBytes(pollIdVote), signerSeed];

                const [candidatePda] = anchor.web3.PublicKey.findProgramAddressSync(
                    seeds2, // Array of seeds (pollId + candidateName)
                    program.programId // Your program's public key
                );
                const [signerPda] = anchor.web3.PublicKey.findProgramAddressSync(seed3, program.programId);

                const tx =await program.methods
                .vote(candidateNameBytes(nameVote),new anchor.BN(Number(pollIdVote)))
                .accounts({
                    signer: publicKey, // The signer of the transaction
                    poll: pollPdaVote, // Use the new account's public key
                    candidate: candidatePda, // Use the new account's public key
                    voterRecord: signerPda, // Use the new account's public key
                    systemProgram: SystemProgram.programId, // Solana's system program
                })
                // .signers([newAccountKeypair]) // Add the generated keypair as a signer
                .rpc();
                console.log("Transaction signature:", tx);
                setTxHashVote(tx);
                //redux setup
                const newcandidate: any = {
                    signer: publicKey?.toString(), // Ensure publicKey is available
                    pool_id: Number(pollId), // Convert pollId to a number
                    candidatePda: candidatePda.toString(),
                };
                await dispatch(initializVotes(newcandidate));
                setMessage("Voted successfully!");
            }
        } catch (err) {
            console.error("Transaction error:", err);
            setMessage("Transaction failed!");
        }
    };

    return (
        <>

        <div className="container">
            <div className="section1">
                <div><label>Poll ID:<input className="inputinitialArray1" type="number" value={pollId}
                    onChange={(e:any) => {
                        const value = e.target.value;
                        if (value === "" || parseInt(value, 10) >= 0) {
                            setPollId(value); // Only update if value is non-negative
                        }
                    }
                    } /></label></div>
                <div><label> Description: <input className="input1" type="text" value={description} onChange={(e) => setDescription(e.target.value)} /></label></div>
                <div><label>Poll Start (Unix Timestamp):<input className="input1" type="number" value={pollStart} 
                    onChange={(e:any) => {
                        const value = e.target.value;
                        if (value === "" || parseInt(value, 10) >= 0) {
                            setPollStart(value); // Only update if value is non-negative
                        }
                    }
                }
                /></label></div>
                <div><label> Poll End (Unix Timestamp): <input className="input1" type="number" value={pollEnd}
                    onChange={(e:any) => {
                        const value = e.target.value;
                        if (value === "" || parseInt(value, 10) >= 0) {
                            setPollEnd(value); // Only update if value is non-negative
                        }
                    }
                } /> </label> </div>
                <button className="buttonVote" onClick={() => sayHello("initializePoll")}>
                    initializePoll
                </button>
            </div>

            <div className="section2">
                <div><label>Voter_Name: <input className="input1" type="text" value={nameinit}
                    onChange={(e: any) => setNameinit(e.target.value)} /></label></div>

                <div><label>Poll ID:<input className="input1" type="number" value={pollIdinit}
                    onChange={(e: any) => {
                        const value = e.target.value;
                        if (value === "" || parseInt(value, 10) >= 0) {
                            setPollIdinit(value); // Only update if value is non-negative
                        }
                    }
                    } /></label></div>
                <button className="buttonVote" onClick={() => sayHello("initializeCandidate")}>
                    initializeCandidate
                </button>
            </div>
            
            <div className="section3">
            <div><label>Voter_Name: <input className="input1" type="text" value={nameVote}
                    onChange={(e: any) => setNameVote(e.target.value)} /></label></div>

                <div><label>Poll ID:<input className="input1" type="number" value={pollIdVote}
                    onChange={(e: any) => {
                        const value = e.target.value;
                        if (value === "" || parseInt(value, 10) >= 0) {
                            setPollIdVote(value); // Only update if value is non-negative
                        }
                      }
                    } /></label></div>
                <button className="buttonVote" onClick={() => sayHello("vote")}>
                    vote
                </button>
            </div>

            </div>
            <div className="continer2">
                <div>
                    <table className="dataTable">
                        <thead>
                            <tr>
                                <th>Pool ID</th>
                                <th>Poll Start</th>
                                <th>Poll End</th>
                            </tr>
                        </thead>
                        <tbody>
                            {poolinitAll.length > 0 ? (
                                poolinitAll.map((pool: any, index: number) => (
                                    <tr key={index}>
                                        <td>{pool?.account?.pollId.toString()}</td>
                                        <td>{pool?.account?.pollStart.toString()}</td>
                                        <td>{pool?.account?.pollEnd.toString()}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3}>No pools available</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div>
                    <table className="dataTable">
                        <thead>
                            <tr>
                                <th>candidateName</th>
                                {/* <th>Id</th> */}
                            </tr>
                        </thead>
                        <tbody>
                            {poolCandidateAll.length > 0 ? (
                                poolCandidateAll.map((pool: any, index: any) => (
                                    <tr key={index}>
                                        <td>{pool?.account?.candidateName.toString()}</td>
                                        {/* <td>{pool.poolid}</td> */}
                                    </tr>
                                ))
                            ) :
                                (
                                    <tr>
                                        <td colSpan={3}>No candidates available</td>
                                    </tr>
                                )
                            }
                        </tbody>
                    </table>
                </div>  
                <div>
                    <table className="dataTable">
                        <thead>
                            <tr>
                                <th>voter</th>
                                <th>number of votes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {poolCandidateAll.length > 0 ? (
                                poolCandidateAll.map((pool: any, index: any) => (
                                    <tr key={index}>
                                        <td>{pool?.account?.candidateName.toString()}</td>
                                        <td>{pool?.account?.candidateVotes.toString()}</td>
                                    </tr>
                                ))
                            ) :
                                (
                                    <tr>
                                        <td colSpan={3}>No votes available</td>
                                    </tr>
                                )
                            }
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="message">
            {message && <p>{message}</p>}
            </div>

        </>
    );
};

export default Votee;






























// //////////---------------------------------------------------------------------////////

// import { FC, useEffect, useState } from "react";
// import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
// import { Program, AnchorProvider, web3, BN } from "@project-serum/anchor";
// import { useWallet } from "@solana/wallet-adapter-react";
// import idl from "../../../anchor/target/idl/voteTest.json";
// import * as anchor from "@coral-xyz/anchor";
// import { useDispatch, useSelector } from "react-redux";
// import {initializCandidates, initializpolls, initializVotes, resetState } from "@/reduxSetup/voterInfo";
// import { RootState } from "@reduxjs/toolkit/query";


// const programID = new PublicKey("Dvr7cy9KKAtxKtTz4eSqYG9dwvEVzvLSViEFE7DerSSS");
// const network = "https://api.devnet.solana.com";

// const opts = {
//     preflightCommitment: "processed" as web3.Commitment,
// };

// const Votee: FC = () => {
//     const { publicKey, signTransaction, signAllTransactions } = useWallet(); // Access wallet functions
//     const [message, setMessage] = useState<string>("");
//     const [pollId, setPollId] = useState("");
//     const [description, setDescription] = useState("");
//     const [pollStart, setPollStart] = useState("");
//     const [pollEnd, setPollEnd] = useState("");
//     const [txHash, setTxHash] = useState("");
//     const [CanditxHash, setTxHashCandi] = useState("");
//     const [voteTxHash, setTxHashVote] = useState("");

//     const [pollIdinit, setPollIdinit] = useState("");
//     const [nameinit, setNameinit] = useState("");

//     const [pollIdVote, setPollIdVote] = useState("");
//     const [nameVote, setNameVote] = useState("");
    
//     const [poolinitAll, setAllPoolInit] = useState<any[]>([]);
//     const [poolCandidateAll, setAllCandidateInit] = useState<any[]>([]);
//     const dispatch: any = useDispatch();

//     const initPools = useSelector((state: any) => state.counter.pools);
//     const initCandidates = useSelector((state: any) => state.counter.candidate);
//     // console.log("publicKey==>", publicKey?.toBase58());

//     // ////useEffect
//     useEffect(() => {
//     //  resetState()
//      setTimeout(() => {
//          pollInitDataCall();
//          readInitializeCandidates();
//      }, 200);
//     }, []);

//     useEffect(()=>{
//         setPollIdinit("")
//         setNameinit("")
//         readInitializeCandidates()
//         setTimeout(() => {
//             setTxHashCandi("")
//         }, 200);
//         resetState()
//     }, [CanditxHash])

//     useEffect(()=>{
//         setPollIdVote("")
//         setNameVote("")
//         readInitializeCandidates()
//         setTimeout(() => {
//             setTxHashVote("")
//         }, 200);
//     }, [voteTxHash])

//     useEffect(() => {
//         resetState()
//         setPollId("")
//         setDescription("")
//         setPollStart("")
//         setPollEnd("")
//         pollInitDataCall()
//         setTimeout(() => {
//             setTxHash("")
//         }, 200);
//     }, [txHash])

//     ////Provider
//     const getProvider = (): AnchorProvider => {
//         const connection = new Connection(network, opts.preflightCommitment);
//         if (!publicKey || !signTransaction || !signAllTransactions) {
//             throw new Error("Wallet is not connected or incomplete.");
//         }
//         // Use the wallet from `useWallet`
//         const wallet = {
//             publicKey, 
//             signTransaction,
//             signAllTransactions,
//         };
//         return new AnchorProvider(connection, wallet, opts);
//     };
//     const provider = getProvider();
//     const program = new Program(idl as any, programID, provider);

//     ////----------------FN------------------------
//     //test
//     const addCandi = async() => {
//         //redux setup
//         // const newcandidate: any = {
//         //     signer: publicKey?.toString(), // Ensure publicKey is available
//         //     pool_id: 222, // Convert pollId to a number
//         //     candidatePda: "8eYB3zei67KPvEv5ZKyn1Fb2vk2XdaFQ4p9D7tL5z6ue",
//         // };
//         // await dispatch(initializCandidates(newcandidate));
//         const signerSeed = publicKey.toBuffer();
//         const seed3 = [pollIdBytes(4), signerSeed];
//         const [signerPda] = anchor.web3.PublicKey.findProgramAddressSync(seed3, program.programId);

//         console.log("signerPda996666==>",signerPda.toString())
//     }
//     const readCandi = async()=>{
//         console.log("initCandidates==>",initCandidates);
//     }
//     ////candidateNameBytes fn
//     const candidateNameBytes = (Name: any) => {
//         return (Buffer.from(Name.toString())); //new name)
//     }

//     //// pollIdBytes fn---------------------------
//     const pollIdBytes = (pId: any) => {
//         const pollIdBigInt = BigInt(new anchor.BN(pId)); // Convert to bigint
//         return (Buffer.from(new BigUint64Array([pollIdBigInt]).buffer));
//     }
//     console.log("pollIdBytes(pollId==>", pollIdBytes(pollId));
//     console.log("pollIdBytes(pollId222==>", [pollIdBytes(pollId)]);

//     /////pollInitDataCallFN------------
//     const pollInitDataCall = async () => {
//         try {
//             // Find all pools associated with the signer
//             const signerPools = initPools.filter(
//                 (owner: any) => owner?.signer === publicKey?.toBase58()
//             );

//             if (signerPools.length > 0) {
//                 // Loop through all pool_ids associated with the signer
//                 for (const pool of signerPools) {
//                     const pollId = pool.pool_id; // Retrieve the pool_id
//                     const pollIdBytes = Buffer.from(
//                         new BigUint64Array([BigInt(pollId)]).buffer
//                     ); // Convert pool_id to bytes
//                     const [pollPda, bump] = anchor.web3.PublicKey.findProgramAddressSync(
//                         [pollIdBytes],
//                         program.programId
//                     );

//                     console.log("initializePoll_PDA:===>", pollPda.toBase58());

//                     // Fetch and process each pool
//                     await readInitializePoll(pollPda.toBase58());
//                 }
//             } else {
//                 console.log("No matching pools found for the signer.");
//             }
//         } catch (error) {
//             console.log("Error in pollInitDataCall:", error);
//         }
//     };
//     ///fn read ------------------------------------------
//     const readInitializePoll = async (pollPda: any) => {
//         try {
//             const final: any = await program.account.poll.fetch(pollPda); // Fetch from blockchain
//             console.log("Fetched Poll Data:", final);

//             // Create a new pool object
//             const newPool = {
//                 poolid: final.pollId.toString(),
//                 poolStart: final.pollStart.toNumber(),
//                 pollEnd: final.pollEnd.toNumber(),
//             };

//             // Check if this pool already exists in the Redux state
//             const poolExists = poolCandidateAll.some(
//                 (candidate: any) => candidate.poolid === newPool.poolid
//             );

//             if (!poolExists) {
//                 // Add only if the pool does not exist
//                 setAllPoolInit((prevPools) => [...prevPools, newPool]);
//                 console.log("Added new pool:", newPool);
//             } else {
//                 console.log("Pool already exists, skipping:", newPool);
//             }
//         } catch (err) {
//             console.error("Transaction error:", err);
//             setMessage("Transaction failed!");
//         }
//     };
    
//     /// fn read intialize candidate
//     const readInitializeCandidates = async () => {
//         try {
//             console.log("initCandidates_redux==>",initCandidates);
//             const signerPool = initCandidates.find((owner: any) => owner?.signer === publicKey?.toBase58());
//             if (signerPool) {
//                 initCandidates.map(async(candPda:any)=>{
//                     const final: any = await program.account.candidate.fetch(candPda?.candidatePda); // Fetch from blockchain
//                     console.log("Fetched_candidate_Data==>:", final);
//                     console.log("Fetched_candidate_Data bahiii==>:", final.candidateVotes.toString());
//                     ///// Update state with new pool data
//                     const newCandidate = {
//                         candidateName: final.candidateName.toString(),
//                         candidateVotes: final.candidateVotes.toString(),
//                         poolid: candPda.pool_id.toString(),
//                     };
//                     console.log("Fetched_candidate_Data bahiii==>:",newCandidate.candidateName);

//                     //// Check if this candidate already exists in the Redux state
//                     const candidateExists = poolCandidateAll.some(
//                         (candidate: any) => {
//                             console.log("Fetched_candidate_Data bahiii111==>:", newCandidate.candidateName),
//                                 console.log("Fetched_candidate_Data bahiii222==>:", candidate.candidateName)
//                                 candidate.candidateName === newCandidate.candidateName
//                         }
//                     );

//                     if (!candidateExists) {
//                         // Add only if the candidate does not exist
//                         setAllCandidateInit((prevPools) => [...prevPools, newCandidate]);
//                     }
//                 })
//             }else{
//                 console.log("No matching signer found in initPools.");
//             }
  
//         } catch (err) {
//             console.error("Transaction error:", err);
//             setMessage("Transaction failed!");
//         }
//     };



//     ////main fn -----------------------------------------------------------------------
//     ///--------------------------------------------------------------------------------
//     const sayHello = async (value:string) => {
//         try {
//         ////---------------------------------1---------------------------------
//             if(value ==="initializePoll"){
//                 const [pollPda, bump] = anchor.web3.PublicKey.findProgramAddressSync([pollIdBytes(pollId)], program.programId);
//                 console.log("initializePoll_PDA:===>", pollPda.toBase58());
//                 const tx = await program.methods
//                 .initializePoll(
//                     new anchor.BN(Number(pollId)),
//                     description,
//                     new anchor.BN(Number(pollStart)),
//                     new anchor.BN(Number(pollEnd))
//                 )
//                 .accounts({
//                     signer: publicKey, // The signer of the transaction
//                     poll: pollPda,     // Use the new account's public key
//                     systemProgram: SystemProgram.programId, // Solana's system program
//                 })
//                 // .signers([]) // Add the generated keypair as a signer
//                 .rpc();
//                 console.log("Transaction signature:", tx);
//                 setTxHash(tx);
//                 //redux setup
//                 const newPool: any = {
//                     signer: publicKey?.toString(), // Ensure publicKey is available
//                     pool_id: Number(pollId), // Convert pollId to a number
//                   };
//                   await dispatch(initializpolls(newPool));
//                   setMessage("InitializePoll successfully!");
//                 }
//         ////---------------------------------2--------------------------------
//             if (value === "initializeCandidate") {
//                 console.log("initializeCandidate Entry");
//                 // Derive the PDA2
//                 const [pollPdainit, bump] = anchor.web3.PublicKey.findProgramAddressSync([pollIdBytes(pollIdinit)], program.programId);
//                 console.log("PDA:", pollPdainit.toBase58());
//                 const seeds2 = [pollIdBytes(pollIdinit), candidateNameBytes(nameinit)]
//                 // const seeds2 = [pollIdBytes(3), candidateNameBytes("three")]
//                 const [candidatePda] = anchor.web3.PublicKey.findProgramAddressSync(
//                     seeds2, // Array of seeds (pollId + candidateName)
//                     program.programId // Your program's public key
//                 );
//                 console.log("candidatePDA==>:", candidatePda.toBase58());
//                    const tx =await program.methods
//                     .initializeCandidate(candidateNameBytes(nameinit),new anchor.BN(Number(pollIdinit)))
//                     .accounts({
//                         signer: publicKey, // The signer of the transaction
//                         poll: pollPdainit, // Use the new account's public key
//                         candidate: candidatePda, // Use the new account's public key
//                         systemProgram: SystemProgram.programId, // Solana's system program
//                     })
//                     // .signers([newAccountKeypair]) // Add the generated keypair as a signer
//                     .rpc();
//                 console.log("Transaction signature:", tx);
//                 await readInitializeCandidates()
//                 setTxHashCandi(tx);
//                 //redux setup
//                 const newcandidate: any = {
//                     signer: publicKey?.toString(), // Ensure publicKey is available
//                     pool_id: Number(pollId), // Convert pollId to a number
//                     candidatePda: candidatePda.toString(),
//                 };
//                 await dispatch(initializCandidates(newcandidate));
//                 setMessage("initializeCandidate successfully!");

//             }
//             ////---------------------------------3---------------------------------
//             if (value === "vote") {
//                 console.log("vote Entry");
//                 // Derive the PDA3
//                 const [pollPdaVote] = anchor.web3.PublicKey.findProgramAddressSync([pollIdBytes(pollIdVote)], program.programId);
//                 console.log("PDA:", pollPdaVote.toBase58());
//                 const seeds2 = [pollIdBytes(pollIdVote), candidateNameBytes(nameVote)]

//                 const signerSeed = publicKey.toBuffer();
//                 const seed3 = [pollIdBytes(pollIdVote), signerSeed];

//                 const [candidatePda] = anchor.web3.PublicKey.findProgramAddressSync(
//                     seeds2, // Array of seeds (pollId + candidateName)
//                     program.programId // Your program's public key
//                 );
//                 const [signerPda] = anchor.web3.PublicKey.findProgramAddressSync(seed3, program.programId);

//                 const tx =await program.methods
//                 .vote(candidateNameBytes(nameVote),new anchor.BN(Number(pollIdVote)))
//                 .accounts({
//                     signer: publicKey, // The signer of the transaction
//                     poll: pollPdaVote, // Use the new account's public key
//                     candidate: candidatePda, // Use the new account's public key
//                     voterRecord: signerPda, // Use the new account's public key
//                     systemProgram: SystemProgram.programId, // Solana's system program
//                 })
//                 // .signers([newAccountKeypair]) // Add the generated keypair as a signer
//                 .rpc();
//                 console.log("Transaction signature:", tx);
//                 setTxHashVote(tx);
//                 //redux setup
//                 const newcandidate: any = {
//                     signer: publicKey?.toString(), // Ensure publicKey is available
//                     pool_id: Number(pollId), // Convert pollId to a number
//                     candidatePda: candidatePda.toString(),
//                 };
//                 await dispatch(initializVotes(newcandidate));
//                 setMessage("Voted successfully!");
//             }
//         } catch (err) {
//             console.error("Transaction error:", err);
//             setMessage("Transaction failed!");
//         }
//     };

//     return (
//         <>
//         <button onClick={addCandi}>Add Pool</button>
//         <br></br>
//         <button onClick={readCandi}>readPool</button>

//         <div className="container">
//             <div className="section1">
//                 <div><label>Poll ID:<input className="inputinitialArray1" type="number" value={pollId}
//                     onChange={(e:any) => {
//                         const value = e.target.value;
//                         if (value === "" || parseInt(value, 10) >= 0) {
//                             setPollId(value); // Only update if value is non-negative
//                         }
//                     }
//                     } /></label></div>
//                 <div><label> Description: <input className="input1" type="text" value={description} onChange={(e) => setDescription(e.target.value)} /></label></div>
//                 <div><label>Poll Start (Unix Timestamp):<input className="input1" type="number" value={pollStart} 
//                     onChange={(e:any) => {
//                         const value = e.target.value;
//                         if (value === "" || parseInt(value, 10) >= 0) {
//                             setPollStart(value); // Only update if value is non-negative
//                         }
//                     }
//                 }
//                 /></label></div>
//                 <div><label> Poll End (Unix Timestamp): <input className="input1" type="number" value={pollEnd}
//                     onChange={(e:any) => {
//                         const value = e.target.value;
//                         if (value === "" || parseInt(value, 10) >= 0) {
//                             setPollEnd(value); // Only update if value is non-negative
//                         }
//                     }
//                 } /> </label> </div>
//                 <button className="buttonVote" onClick={() => sayHello("initializePoll")}>
//                     initializePoll
//                 </button>
//             </div>

//             <div className="section2">
//                 <div><label>Voter_Name: <input className="input1" type="text" value={nameinit}
//                     onChange={(e: any) => setNameinit(e.target.value)} /></label></div>

//                 <div><label>Poll ID:<input className="input1" type="number" value={pollIdinit}
//                     onChange={(e: any) => {
//                         const value = e.target.value;
//                         if (value === "" || parseInt(value, 10) >= 0) {
//                             setPollIdinit(value); // Only update if value is non-negative
//                         }
//                     }
//                     } /></label></div>
//                 <button className="buttonVote" onClick={() => sayHello("initializeCandidate")}>
//                     initializeCandidate
//                 </button>
//             </div>
            
//             <div className="section3">
//             <div><label>Voter_Name: <input className="input1" type="text" value={nameVote}
//                     onChange={(e: any) => setNameVote(e.target.value)} /></label></div>

//                 <div><label>Poll ID:<input className="input1" type="number" value={pollIdVote}
//                     onChange={(e: any) => {
//                         const value = e.target.value;
//                         if (value === "" || parseInt(value, 10) >= 0) {
//                             setPollIdVote(value); // Only update if value is non-negative
//                         }
//                       }
//                     } /></label></div>
//                 <button className="buttonVote" onClick={() => sayHello("vote")}>
//                     vote
//                 </button>
//             </div>

//             </div>
//             <div className="continer2">
//                 <div>
//                     <table className="dataTable">
//                         <thead>
//                             <tr>
//                                 <th>Pool ID</th>
//                                 <th>Poll Start</th>
//                                 <th>Poll End</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {poolinitAll.length > 0 ? (
//                                 poolinitAll.map((pool: any, index: number) => (
//                                     <tr key={index}>
//                                         <td>{pool.poolid}</td>
//                                         <td>{new Date(pool.poolStart * 1000).toLocaleString()}</td>
//                                         <td>{new Date(pool.pollEnd * 1000).toLocaleString()}</td>
//                                     </tr>
//                                 ))
//                             ) : (
//                                 <tr>
//                                     <td colSpan={3}>No pools available</td>
//                                 </tr>
//                             )}
//                         </tbody>
//                     </table>
//                 </div>

//                 <div>
//                     <table className="dataTable">
//                         <thead>
//                             <tr>
//                                 <th>candidateName</th>
//                                 {/* <th>Id</th> */}
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {poolCandidateAll.length > 0 ? (
//                                 poolCandidateAll.map((pool: any, index: any) => (
//                                     <tr key={index}>
//                                         <td>{pool.candidateName}</td>
//                                         {/* <td>{pool.poolid}</td> */}
//                                     </tr>
//                                 ))
//                             ) :
//                                 (
//                                     <tr>
//                                         <td colSpan={3}>No candidates available</td>
//                                     </tr>
//                                 )
//                             }
//                         </tbody>
//                     </table>
//                 </div>  
//                 <div>
//                     <table className="dataTable">
//                         <thead>
//                             <tr>
//                                 <th>voter</th>
//                                 <th>number of votes</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {poolCandidateAll.length > 0 ? (
//                                 poolCandidateAll.map((pool: any, index: any) => (
//                                     <tr key={index}>
//                                         <td>{pool.candidateName}</td>
//                                         <td>{pool.candidateVotes}</td>
//                                     </tr>
//                                 ))
//                             ) :
//                                 (
//                                     <tr>
//                                         <td colSpan={3}>No votes available</td>
//                                     </tr>
//                                 )
//                             }
//                         </tbody>
//                     </table>
//                 </div>
//             </div>
//             <div className="message">
//             {message && <p>{message}</p>}
//             </div>

//         </>
//     );
// };

// export default Votee;


