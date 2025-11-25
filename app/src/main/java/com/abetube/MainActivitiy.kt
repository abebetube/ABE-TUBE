package com.abetube

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.google.android.exoplayer2.ExoPlayer
import com.google.android.exoplayer2.MediaItem
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import androidx.lifecycle.viewmodel.compose.viewModel
import org.schabi.newpipe.extractor.NewPipe
import org.schabi.newpipe.extractor.ServiceList
import org.schabi.newpipe.extractor.search.SearchExtractor
import org.schabi.newpipe.extractor.stream.StreamInfoItem
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.Alignment

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ABETUBETheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val viewModel: SearchViewModel = viewModel()
                    SearchScreen(viewModel)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SearchScreen(viewModel: SearchViewModel) {
    val context = LocalContext.current
    val searchResults by viewModel.searchResults
    var query by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    val player = remember { ExoPlayer.Builder(context).build() }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "ABETUBE",
            style = MaterialTheme.typography.headlineLarge,
            color = Color(0xFFE53935),
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(24.dp))

        OutlinedTextField(
            value = query,
            onValueChange = { query = it },
            label = { Text("חפש שירים...") },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(8.dp))

        Button(
            onClick = { scope.launch { viewModel.search(query) } },
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE53935)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("חפש")
        }

        if (searchResults.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("אין תוצאות – חפש משהו!", color = Color.Gray)
            }
        } else {
            LazyColumn {
                items(searchResults) { item ->
                    Card(
                        onClick = {
                            scope.launch {
                                val streamUrl = viewModel.getAudioStream(item.url)
                                if (streamUrl != null) {
                                    val mediaItem = MediaItem.fromUri(streamUrl)
                                    player.setMediaItem(mediaItem)
                                    player.prepare()
                                    player.play()
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(text = item.name, color = Color.White)
                            Text(text = item.uploaderName, color = Color.Gray)
                        }
                    }
                }
            }
        }
    }
}

class SearchViewModel : ViewModel() {
    val searchResults = mutableStateOf<List<StreamInfoItem>>(emptyList())

    suspend fun search(query: String) {
        withContext(Dispatchers.IO) {
            try {
                NewPipe.init(ServiceList.YouTube)
                val extractor = ServiceList.YouTube.getSearchExtractor(query)
                extractor.fetchPage()
                searchResults.value = extractor.items ?: emptyList()
            } catch (e: Exception) {
                searchResults.value = emptyList()
            }
        }
    }

    suspend fun getAudioStream(videoUrl: String): String? {
        return withContext(Dispatchers.IO) {
            try {
                val extractor = ServiceList.YouTube.getStreamExtractor(videoUrl)
                extractor.fetchPage()
                extractor.audioStreams.firstOrNull()?.url
            } catch (e: Exception) {
                null
            }
        }
    }
}

@Composable
fun ABETUBETheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = Color(0xFFE53935),
            background = Color.Black,
            surface = Color(0xFF121212)
        ),
        content = content
    )
}
